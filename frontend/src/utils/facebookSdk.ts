type FacebookSdkInitOptions = {
  appId: string;
  version: string;
  locale?: string; // e.g. en_US, zh_TW
};

type FacebookBusiness = {
  id: string;
  name?: string;
};

type FacebookPage = {
  id: string;
  name?: string;
  access_token?: string;
};

let facebookSdkPromise: Promise<void> | null = null;

function normalizeFacebookApiVersion(rawVersion: string): string {
  let version = rawVersion.trim();
  if (!version) return 'v23.0';
  if (/^[Vv]\d/.test(version)) version = `v${version.slice(1)}`;
  if (!version.startsWith('v')) version = `v${version}`;
  return version;
}

export async function ensureFacebookSdkLoaded(
  options?: Partial<FacebookSdkInitOptions>
): Promise<void> {
  if (window.FB) return;

  if (facebookSdkPromise) {
    await facebookSdkPromise;
    return;
  }

  const appId = options?.appId ?? import.meta.env.VITE_FACEBOOK_APP_ID?.trim();
  const rawVersion = options?.version ?? import.meta.env.VITE_FACEBOOK_API_VERSION?.trim();
  const locale = options?.locale ?? 'en_US';

  if (!appId) {
    throw new Error('缺少 Facebook App ID，無法載入 Facebook SDK');
  }

  const version = normalizeFacebookApiVersion(rawVersion || '');

  facebookSdkPromise = new Promise<void>((resolve, reject) => {
    window.fbAsyncInit = function () {
      if (!window.FB) {
        reject(new Error('Facebook SDK 載入失敗'));
        return;
      }

      window.FB.init({
        appId,
        cookie: true,
        xfbml: false,
        version,
      });

      window.FB.AppEvents?.logPageView?.();
      resolve();
    };

    if (document.getElementById('facebook-jssdk')) return;

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.async = true;
    script.defer = true;
    script.src = `https://connect.facebook.net/${locale}/sdk.js`;
    script.onerror = () => reject(new Error('無法載入 Facebook SDK，請檢查網路或 CSP 設定'));
    document.body.appendChild(script);
  });

  await facebookSdkPromise;
}

export function fbGetLoginStatus(): Promise<FBLoginStatusResponse> {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK 尚未載入'));
      return;
    }
    window.FB.getLoginStatus(resolve);
  });
}

export function fbLogin(scope: string): Promise<FBLoginStatusResponse> {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK 尚未載入'));
      return;
    }
    window.FB.login(resolve, { scope });
  });
}

export function fbGetManagedPages(): Promise<FacebookPage[]> {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK 尚未載入'));
      return;
    }

    window.FB.api(
      '/me/accounts',
      'GET',
      { fields: 'id,name,access_token' },
      (response: unknown) => {
        const payload = response as { data?: FacebookPage[]; error?: { message?: string } };
        if (payload?.error?.message) {
          reject(new Error(payload.error.message));
          return;
        }
        resolve(payload.data ?? []);
      }
    );
  });
}

export function fbGetBusinesses(): Promise<FacebookBusiness[]> {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK 尚未載入'));
      return;
    }

    window.FB.api('/me/businesses', 'GET', { fields: 'id,name' }, (response: unknown) => {
      const payload = response as { data?: FacebookBusiness[]; error?: { message?: string } };
      if (payload?.error?.message) {
        reject(new Error(payload.error.message));
        return;
      }
      resolve(payload.data ?? []);
    });
  });
}

export function fbGetBusinessPages(businessId: string): Promise<FacebookPage[]> {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK 尚未載入'));
      return;
    }
    const id = businessId.trim();
    if (!id) {
      reject(new Error('businessId 不可為空'));
      return;
    }

    const done = (response: unknown) => {
      const payload = response as { data?: FacebookPage[]; error?: { message?: string } };
      if (payload?.error?.message) {
        reject(new Error(payload.error.message));
        return;
      }
      resolve(payload.data ?? []);
    };

    window.FB.api(`/${id}/owned_pages`, 'GET', { fields: 'id,name' }, (owned: unknown) => {
      const ownedPayload = owned as { data?: FacebookPage[]; error?: { message?: string } };
      if (ownedPayload?.error?.message) {
        reject(new Error(ownedPayload.error.message));
        return;
      }

      if (Array.isArray(ownedPayload?.data) && ownedPayload.data.length) {
        resolve(ownedPayload.data);
        return;
      }

      window.FB.api(`/${id}/client_pages`, 'GET', { fields: 'id,name' }, done);
    });
  });
}

export function fbGetPageAccessToken(pageId: string): Promise<{ id: string; name?: string; access_token: string }> {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK 尚未載入'));
      return;
    }
    const id = pageId.trim();
    if (!id) {
      reject(new Error('pageId 不可為空'));
      return;
    }

    window.FB.api(`/${id}`, 'GET', { fields: 'id,name,access_token' }, (response: unknown) => {
      const payload = response as { id?: string; name?: string; access_token?: string; error?: { message?: string } };
      if (payload?.error?.message) {
        reject(new Error(payload.error.message));
        return;
      }
      if (!payload?.access_token) {
        reject(new Error('無法取得粉絲專頁 access_token（請確認權限與粉專管理權限）'));
        return;
      }
      resolve({ id: String(payload.id || id), name: payload.name, access_token: String(payload.access_token) });
    });
  });
}
