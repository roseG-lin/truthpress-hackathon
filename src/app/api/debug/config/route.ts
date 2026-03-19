import { NextResponse } from "next/server";

export async function GET() {
  const config = {
    env: {
      NODE_ENV: process.env.NODE_ENV,
      SECONDME_CALLBACK_URL: process.env.SECONDME_CALLBACK_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_SECONDME_OAUTH_URL: process.env.NEXT_PUBLIC_SECONDME_OAUTH_URL,
      NEXT_PUBLIC_SECONDME_API_URL: process.env.NEXT_PUBLIC_SECONDME_API_URL,
    },
    hasClientId: !!process.env.SECONDME_CLIENT_ID,
    hasClientSecret: !!process.env.SECONDME_CLIENT_SECRET,
    callbackUrl: process.env.SECONDME_CALLBACK_URL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  };

  return NextResponse.json({
    status: "config_check",
    config,
    expectedCallbackUrl: "https://truthpress-hackathon-production.up.railway.app/api/auth/callback",
    isCallbackUrlCorrect: config.callbackUrl === "https://truthpress-hackathon-production.up.railway.app/api/auth/callback",
    isAppUrlCorrect: config.appUrl === "https://truthpress-hackathon-production.up.railway.app",
    instructions: {
      step1: "在 Railway Web Service Variables 中配置 SECONDME_CALLBACK_URL",
      step2: "在 SecondMe 开发者平台配置回调 URL",
      step3: "确保两者完全一致"
    }
  });
}
