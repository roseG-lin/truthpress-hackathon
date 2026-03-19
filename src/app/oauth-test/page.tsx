"use client";

import { useEffect, useState } from "react";

export default function OAuthTestPage() {
  const [testResult, setTestResult] = useState<any>(null);

  const testCallback = async () => {
    try {
      // 测试回调路由是否存在
      const response = await fetch("/api/auth/callback/test");
      const data = await response.json();
      setTestResult({ success: true, data });
    } catch (error) {
      setTestResult({ success: false, error: (error as Error).message });
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>OAuth 回调测试页面</h1>

      <div style={{ marginBottom: "20px", padding: "10px", background: "#f0f0f0", borderRadius: "8px" }}>
        <h3>当前环境变量</h3>
        <p>NODE_ENV: {process.env.NODE_ENV}</p>
        <p>NEXT_PUBLIC_APP_URL: {process.env.NEXT_PUBLIC_APP_URL || "未设置"}</p>
      </div>

      <button
        onClick={testCallback}
        style={{ padding: "10px 20px", background: "#0ea5e9", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
      >
        测试回调路由
      </button>

      {testResult && (
        <div style={{ marginTop: "20px", padding: "10px", background: testResult.success ? "#d4edda" : "#f8d7da", borderRadius: "8px" }}>
          <h3>测试结果</h3>
          <pre>{JSON.stringify(testResult, null, 2)}</pre>
        </div>
      )}

      <div style={{ marginTop: "20px", padding: "10px", background: "#e7f5ff", borderRadius: "8px" }}>
        <h3>手动测试步骤</h3>
        <ol>
          <li>点击下面的按钮复制回调 URL</li>
          <li>在浏览器新标签中直接访问，看是否能返回 JSON 响应</li>
        </ol>
        <input
          type="text"
          readOnly
          value="https://truthpress-hackathon-production.up.railway.app/api/auth/callback/test"
          style={{ width: "100%", padding: "8px", marginTop: "10px" }}
        />
      </div>

      <div style={{ marginTop: "20px", padding: "10px", background: "#fff3cd", borderRadius: "8px" }}>
        <h3>配置信息</h3>
        <p><strong>回调 URL (不能有换行):</strong></p>
        <code style={{ background: "#f8f9fa", padding: "4px", display: "block", marginTop: "10px" }}>
          https://truthpress-hackathon-production.up.railway.app/api/auth/callback
        </code>
        <p style={{ marginTop: "10px" }}>
          <strong>检查方法：</strong>在 Railway 环境变量中，确保这个值在一行，没有任何换行或空格。
        </p>
      </div>

      <div style={{ marginTop: "20px", padding: "10px", background: "#ffe5d0", borderRadius: "8px" }}>
        <h3>登录测试</h3>
        <p>点击下面按钮测试登录流程：</p>
        <a
          href="/api/auth/login"
          style={{ display: "inline-block", padding: "10px 20px", background: "#6366f1", color: "white", textDecoration: "none", borderRadius: "4px" }}
        >
          跳转到 SecondMe 登录
        </a>
      </div>
    </div>
  );
}
