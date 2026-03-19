import { getSecondMeConfig } from "./secondme-config";

const TOKEN_URL = "https://api.mindverse.com/gate/lab/api/oauth/token/code";
const REFRESH_TOKEN_URL = "https://api.mindverse.com/gate/lab/api/oauth/token/refresh";

type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

function getConfig() {
  return getSecondMeConfig();
}

export function getAuthUrl(state: string): string {
  const config = getConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.callbackUrl,
    response_type: "code",
    state,
  });

  return `${config.oauthUrl}?${params.toString()}`;
}

export async function getAccessToken(code: string): Promise<TokenResponse> {
  const config = getConfig();
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.callbackUrl,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange authorization code for token");
  }

  const result = await response.json();
  if (result.code !== 0) {
    throw new Error(result.message || "Token exchange failed");
  }

  return result.data;
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const config = getConfig();
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(REFRESH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh access token");
  }

  const result = await response.json();
  if (result.code !== 0) {
    throw new Error(result.message || "Token refresh failed");
  }

  return result.data;
}

export async function getUserInfo(accessToken: string): Promise<{
  id: string;
  nickname?: string;
  avatar?: string;
  [key: string]: unknown;
}> {
  const config = getConfig();
  const response = await fetch(`${config.apiUrl}/user/info`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user info");
  }

  const result = await response.json();
  return result.code === 0 ? result.data : result;
}

export async function getUserShades(accessToken: string): Promise<Record<string, unknown>> {
  const config = getConfig();
  const response = await fetch(`${config.apiUrl}/user/info/shades`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user shades");
  }

  const result = await response.json();
  return result.code === 0 ? result.data : result;
}

export async function getUserSoftMemory(accessToken: string): Promise<Record<string, unknown>> {
  const config = getConfig();
  const response = await fetch(`${config.apiUrl}/user/info/softmemory`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user soft memory");
  }

  const result = await response.json();
  return result.code === 0 ? result.data : result;
}

export async function sendChatMessage(accessToken: string, message: string): Promise<{
  content: string;
  [key: string]: unknown;
}> {
  const config = getConfig();
  const response = await fetch(`${config.apiUrl}/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error("Failed to send chat message");
  }

  const result = await response.json();
  return result.code === 0 ? result.data : result;
}

export async function createNote(accessToken: string, data: {
  title: string;
  content: string;
  tags?: string[];
}): Promise<{
  id: string;
  title: string;
  content: string;
  [key: string]: unknown;
}> {
  const config = getConfig();
  const response = await fetch(`${config.apiUrl}/note`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create note");
  }

  const result = await response.json();
  return result.code === 0 ? result.data : result;
}
