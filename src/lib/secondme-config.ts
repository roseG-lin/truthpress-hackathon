const DEFAULT_SECONDME_API_URL = "https://app.mindos.com/gate/lab/api/secondme";
const DEFAULT_SECONDME_OAUTH_URL = "https://go.second.me/oauth/";

type EnvSource = Record<string, string | undefined>;

function readRequiredEnv(env: EnvSource, key: "SECONDME_CLIENT_ID" | "SECONDME_CLIENT_SECRET" | "SECONDME_CALLBACK_URL") {
  const value = env[key]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function readOptionalEnv(env: EnvSource, key: "NEXT_PUBLIC_SECONDME_API_URL" | "NEXT_PUBLIC_SECONDME_OAUTH_URL", fallback: string) {
  const value = env[key]?.trim();
  return value || fallback;
}

export function getSecondMeConfig(env: EnvSource = process.env) {
  return {
    apiUrl: readOptionalEnv(env, "NEXT_PUBLIC_SECONDME_API_URL", DEFAULT_SECONDME_API_URL),
    oauthUrl: readOptionalEnv(env, "NEXT_PUBLIC_SECONDME_OAUTH_URL", DEFAULT_SECONDME_OAUTH_URL),
    clientId: readRequiredEnv(env, "SECONDME_CLIENT_ID"),
    clientSecret: readRequiredEnv(env, "SECONDME_CLIENT_SECRET"),
    callbackUrl: readRequiredEnv(env, "SECONDME_CALLBACK_URL"),
  };
}
