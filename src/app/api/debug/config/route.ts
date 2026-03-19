import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
  const headersList = headers();

  // 清理环境变量中的换行符
  const cleanEnvVar = (value: string | undefined) => {
    if (!value) return undefined;
    return value
      .replace(/\r\n/g, "")
      .replace(/\n/g, "")
      .replace(/\r/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const callbackUrl = cleanEnvVar(process.env.SECONDME_CALLBACK_URL);
  const appUrl = cleanEnvVar(process.env.NEXT_PUBLIC_APP_URL);

  const config = {
    env: {
      NODE_ENV: process.env.NODE_ENV,
      SECONDME_CALLBACK_URL: callbackUrl,
      NEXT_PUBLIC_APP_URL: appUrl,
      NEXT_PUBLIC_SECONDME_OAUTH_URL: process.env.NEXT_PUBLIC_SECONDME_OAUTH_URL,
      NEXT_PUBLIC_SECONDME_API_URL: process.env.NEXT_PUBLIC_SECONDME_API_URL,
    },
    hasClientId: !!process.env.SECONDME_CLIENT_ID,
    hasClientSecret: !!process.env.SECONDME_CLIENT_SECRET,
    callbackUrl: callbackUrl,
    appUrl: appUrl,
  };

  return NextResponse.json({
    status: "config_check",
    requestInfo: {
      host: headersList.get("host"),
      forwardedHost: headersList.get("x-forwarded-host"),
      forwardedProto: headersList.get("x-forwarded-proto"),
    },
    config,
    expectedCallbackUrl: "https://truthpress-hackathon-production.up.railway.app/api/auth/callback",
    isCallbackUrlCorrect: callbackUrl === "https://truthpress-hackathon-production.up.railway.app/api/auth/callback",
    isAppUrlCorrect: appUrl === "https://truthpress-hackathon-production.up.railway.app",
    troubleshooting: {
      ifCallbackUrlWrong: "在 Railway 删除环境变量后重新手动输入，确保在一行",
      correctFormat: "https://truthpress-hackathon-production.up.railway.app/api/auth/callback"
    }
  });
}
