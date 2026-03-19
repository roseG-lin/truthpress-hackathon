"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { Brain, LogOut, LayoutDashboard, User, History } from "lucide-react";

interface DashboardNavProps {
  user?: {
    displayName?: string;
    secondMeId?: string;
  } | null;
  children?: React.ReactNode;
}

export function DashboardNav({ user, children }: DashboardNavProps) {
  const displayName = user?.displayName || user?.secondMeId?.slice(0, 8) || "用户";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      {/* 固定导航栏 */}
      <nav className="sticky top-0 z-50 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl shadow-sm shadow-gray-200/30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Logo size="sm" withText={true} />
          
          <div className="flex items-center gap-6">
            {/* 导航链接 */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900"
              >
                <LayoutDashboard className="h-4 w-4" />
                概览
              </Link>
              <Link
                href="/dashboard/memories"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900"
              >
                <User className="h-4 w-4" />
                记忆
              </Link>
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900"
              >
                <User className="h-4 w-4" />
                资料
              </Link>
              <Link
                href="/cafe"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-sky-200 transition-all hover:shadow-lg hover:shadow-sky-300"
              >
                <Brain className="h-4 w-4" />
                真理之梯
              </Link>
            </div>
            
            {/* 用户信息 */}
            <div className="flex items-center gap-3 border-l border-gray-200 pl-6">
              <div className="hidden lg:block text-right">
                <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-500">SecondMe 用户</p>
              </div>
              <Link
                href="/api/auth/logout"
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      {/* 主内容区 */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
