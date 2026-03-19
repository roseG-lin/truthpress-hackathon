import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(request: Request) {
  const url = new URL(request.url);

  // 尝试从 X-Forwarded-Host 获取真实的主机名
  const headersList = headers();
  const forwardedHost = headersList.get("x-forwarded-host");
  const forwardedProto = headersList.get("x-forwarded-proto");

  // 如果有代理头，使用代理的协议和主机
  const realUrl = forwardedHost
    ? `${forwardedProto || "https"}://${forwardedHost}`
    : url.origin;

  return NextResponse.json({
    status: "callback_route_working",
    message: "OAuth 回调路由正常工作",
    timestamp: new Date().toISOString(),
    requestUrl: url.origin,      // 原始请求的 URL
    realUrl: realUrl,              // 真实的外部 URL
    path: url.pathname,
    receivedAt: new Date().toLocaleString("zh-CN"),
    headers: {
      host: headersList.get("host"),
      forwardedHost: forwardedHost,
      forwardedProto: forwardedProto,
      xForwardedFor: headersList.get("x-forwarded-for"),
    },
  });
}
