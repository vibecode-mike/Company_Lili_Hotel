import type { Config } from 'tailwindcss'

/**
 * 會員管理系統 - 統一主題色彩系統
 *
 * 此配置定義了所有在代碼中使用的顏色，確保：
 * 1. 顏色值完全保持原樣（不改變UI外觀）
 * 2. 使用語義化命名，便於維護
 * 3. 集中管理，方便未來調整
 */

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ========== 品牌主色 ==========
        brand: {
          primary: '#0f6beb',      // 主要品牌藍色（按鈕、鏈接、高亮）
          secondary: '#2b7fff',    // 次要品牌藍色
          hover: '#0d5ac4',        // 懸停狀態
          active: '#193cb8',       // 按下狀態
        },

        // ========== 文字顏色 ==========
        text: {
          primary: '#383838',      // 主要文字色（最常用）
          secondary: '#717182',    // 次要文字色
          tertiary: '#6e6e6e',     // 三級文字色（標籤、說明）
          quaternary: '#6a7282',   // 四級文字色（更淺）
          dark: '#364153',         // 深色文字
          medium: '#4a5565',       // 中等文字
          light: '#9ca3af',        // 淺色文字
          muted: '#a8a8a8',        // 禁用/次要文字
        },

        // ========== 背景顏色 ==========
        bg: {
          // 藍色系背景
          'blue-50': '#f0f6ff',    // 極淺藍背景
          'blue-100': '#e1ebf9',   // 淺藍背景（選中狀態）
          'blue-200': '#d0e0f5',   // 淺藍背景（懸停狀態）
          'blue-300': '#e0ecff',   // 淺藍變體1
          'blue-400': '#f4f8ff',   // 極淺藍變體
          'blue-500': '#f6f9fd',   // 極淺藍變體2
          'blue-600': '#edf0f8',   // 極淺藍變體3

          // 灰色系背景
          'gray-50': '#f9fafb',    // 極淺灰
          'gray-100': '#f8fafc',   // 極淺灰2
          'gray-200': '#f3f3f5',   // 淺灰
          'gray-300': '#f3f4f6',   // 淺灰2
          'gray-400': '#e5e5e5',   // 中淺灰
          'gray-500': '#e0e0e0',   // 中灰

          // 深色背景
          dark: '#242424',         // 深色背景（按鈕）
          darker: '#1e1e1e',       // 更深背景
          darkest: '#0a0a0a',      // 最深背景
        },

        // ========== 功能色 ==========
        status: {
          // 錯誤/危險
          error: '#f44336',        // 錯誤色主色
          'error-dark': '#d32f2f', // 錯誤色深色
          'error-light': '#ffebee',// 錯誤色淺背景
          'error-lighter': '#fff5f5', // 錯誤色極淺背景

          // 成功
          success: '#06c755',      // 成功色主色（LINE綠）
          'success-dark': '#05b34d', // 成功色深色
          'success-light': '#e6f7e9', // 成功色淺背景

          // 警告
          warning: '#eba20f',      // 警告色主色
          'warning-dark': '#7f6c00', // 警告色深色
          'warning-light': '#fdf5db', // 警告色淺背景
          'warning-lighter': '#fffaf0', // 警告色極淺背景
        },

        // ========== 邊框顏色 ==========
        border: {
          primary: '#b6c8f1',      // 主要邊框色（Sidebar）
          secondary: '#e5e7eb',    // 次要邊框色
          light: '#e1ebf9',        // 淺色邊框
          lighter: '#d1d5dc',      // 更淺邊框
          brand: '#0f6beb',        // 品牌色邊框
        },

        // ========== LINE 平台色 ==========
        line: {
          green: '#06c755',        // LINE 官方綠色
        },

        // ========== Sidebar 專用色 ==========
        sidebar: {
          bg: '#f8fafc',           // Sidebar 背景
          border: '#b6c8f1',       // Sidebar 邊框
          'item-hover': '#e1ebf9', // 選項懸停背景
          'item-active': '#e1ebf9',// 選項激活背景
          'text-active': '#0f6beb',// 選項激活文字
          'text-normal': '#383838',// 選項正常文字
          'text-label': '#6e6e6e', // 分類標籤文字
        },
      },

      // ========== 保留原有的 Tailwind 灰色系統 ==========
      // 這些是 Tailwind 默認提供的，我們保留它們
    },
  },
  plugins: [],
}

export default config
