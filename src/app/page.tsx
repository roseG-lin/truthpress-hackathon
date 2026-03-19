"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Brain, Shield, Sparkles, Search, Heart, CheckCircle, Zap, Layers, Users } from "lucide-react";
import { Logo } from "@/components/Logo";

type Profile = {
  displayName?: string;
};

type UserPayload = {
  secondMeId?: string;
  profiles?: Profile[];
  displayName?: string;
};

function resolveUserName(user: UserPayload | null): string {
  if (!user) {
    return "访客";
  }

  return (
    user.profiles?.[0]?.displayName ||
    user.displayName ||
    user.secondMeId?.slice(0, 8) ||
    "访客"
  );
}

function FeatureCard({
  icon: Icon,
  title,
  problem,
  solution,
  gradient,
  accentColor,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  problem: string;
  solution: string;
  gradient: string;
  accentColor: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, delay }}
      className="group relative overflow-hidden rounded-[2rem] border border-gray-200/60 bg-white/80 p-10 shadow-xl shadow-gray-200/40 backdrop-blur-2xl transition-all duration-500 hover:shadow-2xl hover:shadow-gray-300/50 hover:-translate-y-2"
    >
      {/* 动态渐变背景 */}
      <div className={`absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 ${gradient}`} />
      
      {/* 装饰性光晕 */}
      <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-gradient-to-br from-white/40 to-transparent opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100" />
      
      {/* 内容 */}
      <div className="relative z-10">
        {/* 图标和标题 */}
        <div className="flex items-start gap-6">
          <div className={`relative flex h-20 w-20 items-center justify-center rounded-3xl ${accentColor} shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
            <Icon className="h-10 w-10 text-white" strokeWidth={1.5} />
            {/* 图标光晕 */}
            <div className={`absolute inset-0 rounded-3xl ${accentColor} blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-500`} />
          </div>
          
          <div className="flex-1 pt-1">
            <h3 className="text-3xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
              {title}
            </h3>
            <div className="mt-2 h-1 w-20 rounded-full bg-gradient-to-r from-sky-500 to-violet-500" />
          </div>
        </div>

        {/* 痛点和解决方案 */}
        <div className="mt-10 space-y-5">
          <div className="relative overflow-hidden rounded-2xl border border-red-200/60 bg-gradient-to-br from-red-50/80 to-red-100/40 p-6 transition-all duration-300 group-hover:border-red-300 group-hover:shadow-lg group-hover:shadow-red-100/50">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 shadow-md shadow-red-200">
                <span className="text-sm font-bold text-white">!</span>
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-red-700">核心痛点</p>
            </div>
            <p className="mt-4 text-base leading-7 text-red-900/80 font-medium">{problem}</p>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 p-6 transition-all duration-300 group-hover:border-emerald-300 group-hover:shadow-lg group-hover:shadow-emerald-100/50">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 shadow-md shadow-emerald-200">
                <CheckCircle className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">创新方案</p>
            </div>
            <p className="mt-4 text-base leading-7 text-emerald-900/80 font-medium">{solution}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AgentCard({
  icon: Icon,
  title,
  summary,
  color,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  summary: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="group relative rounded-2xl border border-gray-200/50 bg-white/50 p-6 transition-all duration-300 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-100"
    >
      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${color} transition-transform group-hover:scale-110`}>
        <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-gray-600">{summary}</p>
    </motion.div>
  );
}

function WorkflowStep({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-sm font-bold text-white shadow-md">
          {number}
        </div>
        {number < 5 && (
          <div className="mt-2 h-full w-px flex-1 bg-gradient-to-b from-sky-300 to-transparent" />
        )}
      </div>
      <div className="flex-1 pb-8">
        <h4 className="text-base font-semibold text-gray-900">{title}</h4>
        <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/profile")
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }
        return (await response.json()) as { user?: UserPayload | null };
      })
      .then((payload) => {
        if (cancelled) return;
        if (payload?.user) {
          setUser(payload.user);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      {/* 导航栏 */}
      <nav className="sticky top-0 z-50 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Logo size="sm" withText={true} />
          
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="h-9 w-20 animate-pulse rounded-full bg-gray-200" />
            ) : user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-sky-300 hover:bg-sky-50"
              >
                <Brain className="h-4 w-4" />
                控制台
              </Link>
            ) : (
              <a
                href="/api/auth/login"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-200 transition-all hover:shadow-lg hover:shadow-sky-300"
              >
                <Shield className="h-4 w-4" />
                登录
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero 区域 */}
      <section className="relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0">
          <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl" />
          <div className="absolute -right-40 top-40 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* 大 Logo 展示 */}
              <div className="flex justify-center mb-8">
                <Logo size="lg" withText={true} />
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">
                <Sparkles className="h-4 w-4" />
                多 Agent 协作 · 消除幻觉 · 搭建共情
              </div>

              <h1 className="mt-8 text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
                在幻觉的迷雾中
                <span className="block bg-gradient-to-r from-sky-600 via-blue-600 to-violet-600 bg-clip-text text-transparent">
                  寻找真实
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
                求真社是一个以多 Agent 协作为核心的内容分析平台。
              </p>

              <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-gray-600">
                A 发散观点，B 核查证据，C 综合结论，D 调用记忆让表达更有温度。
              </p>

              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link
                  href="/cafe"
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-sky-200 transition-all hover:shadow-2xl hover:shadow-sky-300 hover:-translate-y-0.5"
                >
                  开始体验
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-8 py-4 text-base font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50"
                >
                  了解更多
                </Link>
              </div>
            </motion.div>

            {/* 状态卡片 */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mx-auto mt-16 max-w-md rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-lg backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">当前状态</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {user ? `欢迎回来，${resolveUserName(user)}` : "匿名模式"}
                  </p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${user ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                  {user ? (
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <Users className="h-6 w-6 text-gray-400" />
                  )}
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                {user
                  ? "已解锁 SecondMe 记忆共情能力"
                  : "登录后体验完整的共情补充功能"}
              </p>
              
              {!user && (
                <div className="mt-5 pt-5 border-t border-gray-200">
                  <a
                    href="/api/auth/login"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-sky-200 transition-all hover:shadow-lg hover:shadow-sky-300 hover:-translate-y-0.5"
                  >
                    <Shield className="h-4 w-4" />
                    使用 SecondMe 登录
                  </a>
                </div>
              )}
              
              {user && (
                <div className="mt-5 pt-5 border-t border-gray-200">
                  <Link
                    href="/dashboard"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-all hover:border-sky-300 hover:bg-sky-50"
                  >
                    <Brain className="h-4 w-4" />
                    查看控制台
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* 两大核心亮点 */}
      <section id="features" className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/60 bg-sky-50/80 px-5 py-2 text-sm font-semibold text-sky-700 backdrop-blur-sm shadow-sm shadow-sky-100/50">
              <Sparkles className="h-4 w-4" />
              核心价值主张
            </div>
            
            <h2 className="mt-8 text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              解决 AI 时代的
              <span className="relative block mt-2">
                <span className="absolute inset-0 bg-gradient-to-r from-sky-200/50 via-blue-200/50 to-violet-200/50 blur-2xl" />
                <span className="relative bg-gradient-to-r from-sky-600 via-blue-600 to-violet-600 bg-clip-text text-transparent">
                  两大核心挑战
                </span>
              </span>
            </h2>
            <p className="mt-6 text-xl text-gray-600 leading-relaxed">
              我们不只是另一个聊天机器人，而是让观点在证据面前重新排序的共识引擎
            </p>
          </motion.div>

          <div className="mt-16 grid gap-8 lg:grid-cols-2">
            <FeatureCard
              icon={Search}
              title="消除 AI 幻觉"
              problem="传统 AI 直接输出答案，容易编造虚假信息，用户无法判断真假"
              solution="多 Agent 制衡：A 发散观点 → B 联网核查 → C 综合结论，只输出经过验证的真实内容"
              gradient="bg-gradient-to-br from-blue-600/5 via-sky-500/5 to-violet-600/5"
              accentColor="bg-gradient-to-br from-blue-500 via-sky-500 to-blue-600"
              delay={0.1}
            />
            <FeatureCard
              icon={Heart}
              title="搭建共情桥梁"
              problem="人与人之间难以真正理解彼此的经历和立场，AI 表达也往往冷冰冰"
              solution="Agent D 读取 SecondMe 记忆，用你能共鸣的方式表达真实内容，让理解跨越孤独"
              gradient="bg-gradient-to-br from-amber-600/5 via-orange-500/5 to-red-600/5"
              accentColor="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600"
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* 四 Agent 制衡机制 */}
      <section className="relative py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700">
              <Zap className="h-4 w-4" />
              多 Agent 协作
            </div>
            <h2 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              四 Agent 制衡机制
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              每个 Agent 各司其职，通过流程化协作消除幻觉、产出真实、传递理解
            </p>
          </motion.div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <AgentCard
              icon={Brain}
              title="Agent A · 发散思考"
              summary="从多个角度展开观点，先把可能成立的论据摆出来，不急着判断真假"
              color="bg-gradient-to-br from-blue-500 to-blue-600"
              delay={0.1}
            />
            <AgentCard
              icon={Search}
              title="Agent B · 联网核查"
              summary="把 A 提出的论据拆成可核查主张，再通过搜索证据判断支持、推翻或不确定"
              color="bg-gradient-to-br from-red-500 to-red-600"
              delay={0.2}
            />
            <AgentCard
              icon={CheckCircle}
              title="Agent C · 总结优化"
              summary="只基于已经过核查的结果输出结构化结论，避免把未经验证的内容混进最终回答"
              color="bg-gradient-to-br from-violet-500 to-violet-600"
              delay={0.3}
            />
            <AgentCard
              icon={Heart}
              title="Agent D · 共情桥梁"
              summary="当用户觉得'太冷'或'不被理解'时，再结合 softMemory 或背景信息补充表达"
              color="bg-gradient-to-br from-amber-500 to-orange-500"
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* 工作流 */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                从观点到共识
                <span className="block text-gray-500">完整的求真流程</span>
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                每一次点击都是思考，每一次验证都是求真。
                我们让抽象的辩论过程变得清晰可见。
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-3xl border border-gray-200 bg-white/50 p-8 backdrop-blur"
            >
              <WorkflowStep
                number={1}
                title="用户输入观点"
                description="提交争议观点或分析问题，启动求真流程"
              />
              <WorkflowStep
                number={2}
                title="Agent A 发散思考"
                description="从多个角度扩展可能论据和观察角度，不预设对错"
              />
              <WorkflowStep
                number={3}
                title="Agent B 联网核查"
                description="将可验证的部分拆成 claim，通过搜索证据逐一判断"
              />
              <WorkflowStep
                number={4}
                title="Agent C 总结优化"
                description="汇总核查结果，输出结构化结论，只使用已验证内容"
              />
              <WorkflowStep
                number={5}
                title="Agent D 共情补充"
                description="如用户感到表达不贴近自身，结合记忆生成共情补充"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA 区域 */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-blue-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />
        
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              准备好体验真正的
              <br />
              AI 共识引擎了吗？
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-sky-100">
              让分歧被看见，让观点被检验，让共识被生成
            </p>
            <div className="mt-10">
              <Link
                href="/cafe"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-sky-600 shadow-xl transition-all hover:shadow-2xl hover:-translate-y-0.5"
              >
                立即开始
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700">求真社-TRUTHPRESS</span>
            </div>
            <p className="text-sm text-gray-500">
              SecondMe Hackathon 2026 参赛作品
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
