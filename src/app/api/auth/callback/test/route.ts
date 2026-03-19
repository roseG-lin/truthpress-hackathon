import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);

  return NextResponse.json({
    status: "callback_route_working",
    message: "OAuth 回调路由正常工作",
    timestamp: new Date().toISOString(),
    url: url.origin,
    path: url.pathname,
    receivedAt: new Date().toLocaleString("zh-CN"),
  });
}
