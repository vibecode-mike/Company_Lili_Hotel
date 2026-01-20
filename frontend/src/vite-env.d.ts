/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FACEBOOK_APP_ID?: string;
  readonly VITE_FACEBOOK_API_VERSION?: string;
  readonly VITE_FB_API_URL?: string;
  readonly VITE_FB_FIRM_ACCOUNT?: string;
  readonly VITE_FB_FIRM_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: {
      init: (params: {
        appId: string;
        cookie?: boolean;
        xfbml?: boolean;
        version: string;
      }) => void;
      AppEvents?: { logPageView: () => void };
      getLoginStatus: (callback: (response: FBLoginStatusResponse) => void) => void;
      login: (
        callback: (response: FBLoginStatusResponse) => void,
        options?: { scope?: string }
      ) => void;
      api: (
        path: string,
        method: 'GET' | 'POST' | 'DELETE',
        params: Record<string, unknown>,
        callback: (response: unknown) => void
      ) => void;
    };
  }

  type FBLoginStatus = 'connected' | 'not_authorized' | 'unknown';

  interface FBAuthResponse {
    accessToken: string;
    expiresIn: number;
    signedRequest: string;
    userID: string;
  }

  interface FBLoginStatusResponse {
    status: FBLoginStatus;
    authResponse?: FBAuthResponse;
  }
}

export {};
