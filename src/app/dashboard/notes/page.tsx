'use client'

import { useState, useEffect } from 'react'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: string
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes')
      const data = await response.json()
      setNotes(data.notes || [])
    } catch (error) {
      console.error('获取笔记失败:', error)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || loading) return

    setLoading(true)
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      })

      if (!response.ok) throw new Error('创建失败')

      setTitle('')
      setContent('')
      fetchNotes()
    } catch (error) {
      console.error(error)
      alert('创建笔记失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">我的笔记</h2>
        <p className="text-gray-600">创建和管理你的笔记</p>
      </div>

      {/* 创建笔记 */}
      <form onSubmit={handleCreate} className="card p-6 mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="笔记标题..."
          className="input mb-3"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="笔记内容..."
          rows={4}
          className="input resize-none mb-3"
        />
        <div className="flex justify-end">
          <button type="submit" className="button" disabled={loading || !title.trim() || !content.trim()}>
            {loading ? '创建中...' : '创建笔记'}
          </button>
        </div>
      </form>

      {/* 笔记列表 */}
      <div className="grid md:grid-cols-2 gap-4">
        {notes.map((note) => (
          <div key={note.id} className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-2">{note.title}</h3>
            <p className="text-gray-600 text-sm mb-3 line-clamp-3">{note.content}</p>
            <p className="text-xs text-gray-400">
              {new Date(note.createdAt).toLocaleString('zh-CN')}
            </p>
          </div>
        ))}
        {notes.length === 0 && (
          <div className="col-span-2 text-center py-12">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <p className="text-gray-500">还没有笔记，创建第一条笔记吧！</p>
          </div>
        )}
      </div>
    </div>
  )
}
