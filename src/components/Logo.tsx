"use client";

import { motion } from "framer-motion";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
}

export function Logo({ size = "md", withText = true }: LogoProps) {
  const sizeMap = {
    sm: { container: "h-8 w-8", text: "text-lg" },
    md: { container: "h-10 w-10", text: "text-xl" },
    lg: { container: "h-16 w-16", text: "text-3xl" },
  };

  return (
    <div className="flex items-center gap-2.5">
      {/* Logo 图标 */}
      <div className={`relative ${sizeMap[size].container}`}>
        {/* 外圈光晕环 */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-dashed border-sky-300/50"
          style={{ transformOrigin: "center" }}
        />

        {/* 中间旋转环 */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-1.5 rounded-full border border-dashed border-violet-300/60"
          style={{ transformOrigin: "center" }}
        />

        {/* 内层渐变背景 */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-sky-500 via-blue-600 to-violet-600 shadow-lg shadow-sky-200" />

        {/* 中心白色核心 */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="h-3 w-3 rounded-full bg-white/90 blur-[1px]" />
        </motion.div>

        {/* 粒子效果 - 6 个环绕点 */}
        {[0, 60, 120, 180, 240, 300].map((rotation, i) => (
          <motion.div
            key={i}
            animate={{ rotate: 360 }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-0"
            style={{ transformOrigin: "center" }}
          >
            <motion.div
              animate={{ scale: [0.6, 1, 0.6], opacity: [0.4, 0.8, 0.4] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2,
              }}
              className="absolute left-1/2 top-2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white"
            />
          </motion.div>
        ))}
      </div>

      {/* 文字 */}
      {withText && (
        <div className="flex flex-col">
          <span
            className={`font-bold bg-gradient-to-r from-sky-600 via-blue-600 to-violet-600 bg-clip-text text-transparent ${sizeMap[size].text}`}
          >
            求真社-TRUTHPRESS
          </span>
          <span className="text-[10px] text-gray-500 -mt-0.5 tracking-wider">
            Consensus Engine
          </span>
        </div>
      )}
    </div>
  );
}
