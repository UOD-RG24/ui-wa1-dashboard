import {
  type Configuration,
  type PopupRequest,
  PublicClientApplication,
} from "@azure/msal-browser";

export function getAzureAdConfig() {
  const clientId = process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID?.trim() ?? "";
  const tenantId = process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID?.trim() ?? "";
  const apiScope = process.env.NEXT_PUBLIC_AZURE_AD_API_SCOPE?.trim() ?? "";
  return { clientId, tenantId, apiScope };
}

export function isMicrosoftAuthConfigured(): boolean {
  const { clientId, tenantId, apiScope } = getAzureAdConfig();
  return Boolean(clientId && tenantId && apiScope);
}

function buildMsalConfig(): Configuration {
  const { clientId, tenantId } = getAzureAdConfig();
  return {
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      redirectUri: typeof window !== "undefined" ? window.location.origin : undefined,
      postLogoutRedirectUri:
        typeof window !== "undefined" ? window.location.origin : undefined,
    },
    cache: {
      cacheLocation: "sessionStorage",
    },
  };
}

let msalInstance: PublicClientApplication | null = null;
let initPromise: Promise<PublicClientApplication> | null = null;

export async function getMsalInstance(): Promise<PublicClientApplication> {
  if (!isMicrosoftAuthConfigured()) {
    throw new Error(
      "Microsoft sign-in is not configured. Set NEXT_PUBLIC_AZURE_AD_CLIENT_ID, TENANT_ID, and API_SCOPE.",
    );
  }

  if (msalInstance) {
    return msalInstance;
  }

  if (!initPromise) {
    initPromise = (async () => {
      const instance = new PublicClientApplication(buildMsalConfig());
      await instance.initialize();
      msalInstance = instance;
      return instance;
    })();
  }

  return initPromise;
}

export async function acquireMicrosoftAccessToken(): Promise<string> {
  const { apiScope } = getAzureAdConfig();
  const instance = await getMsalInstance();
  const loginRequest: PopupRequest = {
    scopes: [apiScope],
  };

  const accounts = instance.getAllAccounts();
  if (accounts.length > 0) {
    try {
      const silent = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });
      return silent.accessToken;
    } catch {
      // Fall through to interactive login.
    }
  }

  const result = await instance.loginPopup(loginRequest);
  if (!result.accessToken) {
    const tokenResult = await instance.acquireTokenPopup({
      ...loginRequest,
      account: result.account ?? undefined,
    });
    return tokenResult.accessToken;
  }
  return result.accessToken;
}
