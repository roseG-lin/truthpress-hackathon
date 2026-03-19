"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { Brain, LayoutDashboard, User, LogOut, History } from "lucide-react";

interface DashboardNavProps {
  children: React.ReactNode;
  user?: {
    displayName?: string;
    secondMeId?: string;
  } | null;
}

export function DashboardLayout({ children, user }: DashboardNavProps) {
  const pathname = usePathname();
  const displayName = user?.displayName || user?.secondMeId?.slice(0, 8) || "用户";

  const navItems = [
    { href: "/dashboard", label: "概览", icon: LayoutDashboard },
    { href: "/dashboard/memories", label: "记忆", icon: User },
    { href: "/dashboard/profile", label: "资料", icon: User },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      {/* 固定导航栏 */}
      <nav className="sticky top-0 z-50 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl shadow-sm shadow-gray-200/30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Logo size="sm" withText={true} />
          
          <div className="flex items-center gap-4">
            {/* 导航链接 */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-sky-50 text-sky-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/cafe"
                className="ml-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-sky-200 transition-all hover:shadow-lg hover:shadow-sky-300"
              >
                <Brain className="h-4 w-4" />
                真理之梯
              </Link>
            </div>
            
            {/* 用户信息和退出 */}
            <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
              <div className="hidden lg:block text-right">
                <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-500">SecondMe</p>
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
