import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const searchParams = Object.fromEntries(url.searchParams);

  return NextResponse.json({
    status: "oauth_debug",
    message: "OAuth 调试信息",
    currentConfig: {
      environment: process.env.NODE_ENV,
      callbackUrl: process.env.SECONDME_CALLBACK_URL,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      oauthUrl: process.env.NEXT_PUBLIC_SECONDME_OAUTH_URL,
    },
    receivedParams: searchParams,
    expectedParams: {
      code: "授权码 (SecondMe 生成)",
      state: "安全验证码"
    },
    troubleshooting: {
      step1: "确认 SecondMe 开发者平台已配置回调 URL",
      step2: "回调 URL 必须完全匹配: https://truthpress-hackathon-production.up.railway.app/api/auth/callback",
      step3: "不能有尾随斜杠: /api/auth/callback/",
      step4: "必须是 HTTPS: https://",
      step5: "检查 Railway 环境变量 SECONDME_CALLBACK_URL 是否正确",
    },
    testUrls: {
      callbackTest: `${url.origin}/api/auth/callback/test`,
      configTest: `${url.origin}/api/debug/config`,
    }
  });
}
