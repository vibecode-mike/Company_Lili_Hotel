/**
 * 外部服務 Token 自動維護機制
 *
 * 統一管理多個外部服務的認證狀態，提供：
 * - 過期檢查
 * - 即將過期自動刷新
 * - 刷新失敗自動登出
 * - Promise 去重防止併發刷新
 */

import { clearAllAuthData } from './token';

/**
 * 外部服務介面
 */
export interface ExternalService {
  /** 服務名稱（用於日誌和識別） */
  name: string;
  /** 檢查 token 是否已過期 */
  isExpired: () => boolean;
  /** 檢查 token 是否即將過期 */
  isExpiringSoon: (thresholdMinutes: number) => boolean;
  /** 刷新 token，返回新 token 或 null（失敗） */
  refresh: () => Promise<string | null>;
  /** 取得目前的 token */
  getToken: () => string | null;
}

/**
 * Token 管理器
 */
class TokenManager {
  private services: Map<string, ExternalService> = new Map();
  private refreshPromises: Map<string, Promise<string | null>> = new Map();
  private onLogout: (() => void) | null = null;

  /**
   * 設定登出回調
   */
  setLogoutCallback(callback: () => void): void {
    this.onLogout = callback;
  }

  /**
   * 註冊外部服務
   */
  register(service: ExternalService): void {
    this.services.set(service.name, service);
    console.log(`[TokenManager] 已註冊服務: ${service.name}`);
  }

  /**
   * 取消註冊外部服務
   */
  unregister(serviceName: string): void {
    this.services.delete(serviceName);
    this.refreshPromises.delete(serviceName);
  }

  /**
   * 取得服務的 token
   */
  getToken(serviceName: string): string | null {
    const service = this.services.get(serviceName);
    return service?.getToken() ?? null;
  }

  /**
   * 執行登出
   */
  private handleLogout(): void {
    clearAllAuthData();
    if (this.onLogout) {
      this.onLogout();
    }
  }

  /**
   * 刷新指定服務的 token（含 Promise 去重）
   */
  private async refreshService(service: ExternalService): Promise<string | null> {
    // 如果已有刷新請求在進行中，直接返回該 Promise
    const existingPromise = this.refreshPromises.get(service.name);
    if (existingPromise) {
      return existingPromise;
    }

    const refreshPromise = (async () => {
      try {
        console.log(`[TokenManager] 開始刷新 ${service.name} token...`);
        const token = await service.refresh();

        if (token) {
          console.log(`[TokenManager] ${service.name} token 刷新成功`);
          return token;
        }

        console.error(`[TokenManager] ${service.name} token 刷新失敗`);
        return null;
      } catch (error) {
        console.error(`[TokenManager] ${service.name} token 刷新錯誤:`, error);
        return null;
      } finally {
        // 清除 Promise，允許下次刷新
        this.refreshPromises.delete(service.name);
      }
    })();

    this.refreshPromises.set(service.name, refreshPromise);
    return refreshPromise;
  }

  /**
   * 確保指定服務的 token 有效
   *
   * - 若已過期：登出並返回 null
   * - 若即將過期：自動刷新
   * - 若有效：直接返回
   *
   * @param serviceName 服務名稱
   * @param thresholdMinutes 即將過期的閾值（分鐘），預設 5
   * @returns 有效的 token，或 null（需要重新登入）
   */
  async ensureValidToken(serviceName: string, thresholdMinutes = 5): Promise<string | null> {
    const service = this.services.get(serviceName);
    if (!service) {
      console.error(`[TokenManager] 未註冊的服務: ${serviceName}`);
      return null;
    }

    // 1. 若已過期，直接登出
    if (service.isExpired()) {
      console.log(`[TokenManager] ${serviceName} token 已過期，需要重新登入`);
      this.handleLogout();
      return null;
    }

    // 2. 若即將過期，主動刷新
    if (service.isExpiringSoon(thresholdMinutes)) {
      console.log(`[TokenManager] ${serviceName} token 即將過期，主動刷新...`);
      const newToken = await this.refreshService(service);

      if (!newToken) {
        console.error(`[TokenManager] ${serviceName} token 刷新失敗，執行登出`);
        this.handleLogout();
        return null;
      }

      return newToken;
    }

    // 3. Token 有效，直接返回
    return service.getToken();
  }

  /**
   * 檢查所有已註冊服務的 token 狀態
   * 若任一服務的 token 已過期，觸發登出
   *
   * @returns 是否所有服務都有效
   */
  async checkAllServices(): Promise<boolean> {
    for (const [name, service] of this.services) {
      if (service.isExpired()) {
        console.log(`[TokenManager] ${name} token 已過期，需要重新登入`);
        this.handleLogout();
        return false;
      }
    }
    return true;
  }

  /**
   * 刷新所有即將過期的服務
   *
   * @param thresholdMinutes 即將過期的閾值（分鐘），預設 5
   * @returns 是否所有刷新都成功
   */
  async refreshExpiringSoon(thresholdMinutes = 5): Promise<boolean> {
    const results = await Promise.all(
      Array.from(this.services.entries()).map(async ([name, service]) => {
        if (service.isExpiringSoon(thresholdMinutes)) {
          const token = await this.ensureValidToken(name, thresholdMinutes);
          return token !== null;
        }
        return true;
      })
    );
    return results.every(Boolean);
  }

  /**
   * 取得所有已註冊服務的名稱
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }
}

// 單例模式
export const tokenManager = new TokenManager();

// 便捷函數
export const registerService = (service: ExternalService) => tokenManager.register(service);
export const ensureValidToken = (serviceName: string) => tokenManager.ensureValidToken(serviceName);
export const getServiceToken = (serviceName: string) => tokenManager.getToken(serviceName);
export const setTokenManagerLogout = (callback: () => void) => tokenManager.setLogoutCallback(callback);
