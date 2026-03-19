import { useEffect, useRef } from 'react'

interface LogEntry {
  id: string
  agent: 'A' | 'B' | 'C' | 'D' | 'SYSTEM'
  message: string
  timestamp: Date
}

interface LeftPanelProps {
  logs: LogEntry[]
  isStreaming: boolean
}

export default function LeftPanel({ logs, isStreaming }: LeftPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case 'A': return 'text-blue-400'
      case 'B': return 'text-red-400'
      case 'C': return 'text-purple-400'
      case 'D': return 'text-fuchsia-400'
      default: return 'text-gray-400'
    }
  }

  const getAgentPrefix = (agent: string) => {
    switch (agent) {
      case 'A': return '[辩护方]'
      case 'B': return '[反对方]'
      case 'C': return '[法官]'
      case 'D': return '[用户]'
      default: return '[系统]'
    }
  }

  return (
    <div className="h-full bg-gray-950 rounded-2xl border border-gray-800 p-4 font-mono text-sm overflow-hidden flex flex-col">
      {/* 终端头部 */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-gray-400 text-xs uppercase tracking-wider">Terminal</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/30" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/30" />
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/30" />
        </div>
      </div>

      {/* 日志内容 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-700">
        {logs.length === 0 && !isStreaming && (
          <div className="text-gray-600 text-center py-8">
            <p className="mb-2">等待辩论开始...</p>
            <p className="text-xs">提交观点后，AI 将开始辩论</p>
          </div>
        )}

        {logs.map((log, index) => (
          <div key={`${log.id}-${index}`} className="group">
            <span className="text-gray-600 mr-2">
              {new Date(log.timestamp).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </span>
            <span className={getAgentColor(log.agent)}>
              {getAgentPrefix(log.agent)}
            </span>
            <span className="text-gray-300 ml-1">{log.message}</span>
          </div>
        ))}

        {isStreaming && (
          <div className="flex items-center gap-2 text-gray-500">
            <span className="animate-pulse">▊</span>
            <span className="text-xs">处理中...</span>
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
        <span>{logs.length} 条日志</span>
        <span className={isStreaming ? 'text-green-400' : ''}>
          {isStreaming ? '● 直播中' : '○ 待机'}
        </span>
      </div>
    </div>
  )
}
