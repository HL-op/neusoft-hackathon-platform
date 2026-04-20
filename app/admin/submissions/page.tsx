import { useState, useEffect } from 'react'
import { PrismaClient } from '../../generated/prisma/client'
import { useSession } from 'next-auth/react'

const prisma = new PrismaClient()

interface Submission {
  id: string
  code: string
  language: string
  status: string
  score: number | null
  runtime: number | null
  memory: number | null
  userId: string
  problemId: string
  createdAt: Date
  user: {
    name: string | null
    email: string
  }
  problem: {
    title: string
  }
}

export default function SubmissionsPage() {
  const { data: session } = useSession()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // 加载提交列表
  const loadSubmissions = async () => {
    try {
      const whereClause: any = {}
      if (selectedStatus !== 'all') {
        whereClause.status = selectedStatus
      }

      const subs = await prisma.submission.findMany({
        where: whereClause,
        include: {
          user: { select: { name: true, email: true } },
          problem: { select: { title: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
      setSubmissions(subs)
    } catch (error) {
      console.error('Error loading submissions:', error)
    }
  }

  useEffect(() => {
    loadSubmissions()
  }, [selectedStatus])

  // 重新评测
  const rejudge = async (id: string) => {
    if (confirm('确定要重新评测这个提交吗？')) {
      try {
        const response = await fetch('/api/rejudge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ submissionId: id })
        })
        if (response.ok) {
          loadSubmissions()
          alert('已开始重新评测')
        } else {
          alert('重新评测失败')
        }
      } catch (error) {
        console.error('Error rejudging submission:', error)
        alert('重新评测失败')
      }
    }
  }

  // 批量重新评测
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([])
  const toggleSelection = (id: string) => {
    setSelectedSubmissions(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    )
  }

  const rejudgeSelected = async () => {
    if (selectedSubmissions.length === 0) return
    if (confirm(`确定要重新评测选中的 ${selectedSubmissions.length} 个提交吗？`)) {
      try {
        for (const id of selectedSubmissions) {
          await fetch('/api/rejudge', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ submissionId: id })
          })
        }
        loadSubmissions()
        setSelectedSubmissions([])
        alert('已开始批量重新评测')
      } catch (error) {
        console.error('Error rejudging submissions:', error)
        alert('批量重新评测失败')
      }
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-green-900/50 text-green-400'
      case 'WRONG_ANSWER': return 'bg-red-900/50 text-red-400'
      case 'TIME_LIMIT_EXCEEDED': return 'bg-yellow-900/50 text-yellow-400'
      case 'PENDING': return 'bg-blue-900/50 text-blue-400'
      case 'RUNNING': return 'bg-purple-900/50 text-purple-400'
      default: return 'bg-gray-700 text-gray-400'
    }
  }

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">请先登录</h1>
          <a href="/auth/login" className="text-blue-400 hover:underline">前往登录</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 顶部导航栏 */}
      <header className="bg-gray-800 border-b border-gray-700 py-4 px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-400">
            提交管理
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-semibold">{session.user.name || session.user.email}</div>
              <div className="text-sm text-gray-400">管理员</div>
            </div>
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
              退出
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 侧边栏 */}
        <aside className="w-64 bg-gray-800 border-r border-gray-700">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <a href="/admin/dashboard" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700">
                  <span className="text-xl">📊</span>
                  <span>仪表盘</span>
                </a>
              </li>
              <li>
                <a href="/admin/competitions" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700">
                  <span className="text-xl">🏆</span>
                  <span>比赛管理</span>
                </a>
              </li>
              <li>
                <a href="/admin/problems" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700">
                  <span className="text-xl">📝</span>
                  <span>题目管理</span>
                </a>
              </li>
              <li>
                <a href="/admin/participants" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700">
                  <span className="text-xl">👥</span>
                  <span>选手管理</span>
                </a>
              </li>
              <li>
                <a href="/admin/judges" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700">
                  <span className="text-xl">⚖️</span>
                  <span>评委管理</span>
                </a>
              </li>
              <li>
                <a href="/admin/submissions" className="flex items-center gap-3 p-3 rounded-lg bg-blue-900/50 border border-blue-500">
                  <span className="text-xl">📤</span>
                  <span>提交管理</span>
                </a>
              </li>
              <li>
                <a href="/admin/scores" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700">
                  <span className="text-xl">⭐</span>
                  <span>评分管理</span>
                </a>
              </li>
              <li>
                <a href="/admin/reports" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700">
                  <span className="text-xl">📈</span>
                  <span>统计报表</span>
                </a>
              </li>
              <li>
                <a href="/admin/settings" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700">
                  <span className="text-xl">⚙️</span>
                  <span>系统设置</span>
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 p-6">
          <div className="space-y-4">
            {/* 操作栏 */}
            <div className="flex flex-wrap justify-between items-center gap-3">
              <h2 className="text-xl font-bold">提交记录</h2>
              <div className="flex flex-wrap gap-3">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-gray-800 text-white p-2 rounded border border-gray-700"
                >
                  <option value="all">所有状态</option>
                  <option value="PENDING">待评测</option>
                  <option value="RUNNING">评测中</option>
                  <option value="ACCEPTED">通过</option>
                  <option value="WRONG_ANSWER">错误</option>
                  <option value="TIME_LIMIT_EXCEEDED">超时</option>
                </select>
                {selectedSubmissions.length > 0 && (
                  <button
                    onClick={rejudgeSelected}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    批量重测 ({selectedSubmissions.length})
                  </button>
                )}
              </div>
            </div>

            {/* 提交列表 */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4">
                        <input
                          type="checkbox"
                          checked={submissions.length > 0 && selectedSubmissions.length === submissions.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSubmissions(submissions.map(s => s.id))
                            } else {
                              setSelectedSubmissions([])
                            }
                          }}
                          className="rounded text-blue-600"
                        />
                      </th>
                      <th className="text-left py-3 px-4">选手</th>
                      <th className="text-left py-3 px-4">题目</th>
                      <th className="text-left py-3 px-4">语言</th>
                      <th className="text-left py-3 px-4">状态</th>
                      <th className="text-left py-3 px-4">得分</th>
                      <th className="text-left py-3 px-4">运行时间</th>
                      <th className="text-left py-3 px-4">内存</th>
                      <th className="text-left py-3 px-4">提交时间</th>
                      <th className="text-left py-3 px-4">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission) => (
                      <tr key={submission.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedSubmissions.includes(submission.id)}
                            onChange={() => toggleSelection(submission.id)}
                            className="rounded text-blue-600"
                          />
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {submission.user.name || submission.user.email}
                        </td>
                        <td className="py-3 px-4 text-gray-400">{submission.problem.title}</td>
                        <td className="py-3 px-4 text-gray-400">{submission.language}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded ${getStatusColor(submission.status)}`}>
                            {submission.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-yellow-400 font-bold">
                          {submission.score || 0}
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          {submission.runtime ? `${submission.runtime}ms` : '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          {submission.memory ? `${submission.memory}MB` : '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          {new Date(submission.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => rejudge(submission.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm"
                          >
                            重测
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
