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
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // 加载提交列表
  const loadSubmissions = async () => {
    try {
      const subs = await prisma.submission.findMany({
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
  }, [])

  // 查看提交详情
  const viewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission)
    setShowDetailModal(true)
  }

  // 重新评测
  const rejudgeSubmission = async (id: string) => {
    if (confirm('确定要重新评测这个提交吗？')) {
      try {
        // 这里实现重新评测逻辑
        alert('重新评测已触发')
        loadSubmissions()
      } catch (error) {
        console.error('Error rejudging submission:', error)
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
        // 这里实现批量重新评测逻辑
        alert('批量重新评测已触发')
        loadSubmissions()
        setSelectedSubmissions([])
      } catch (error) {
        console.error('Error rejudging submissions:', error)
      }
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
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">提交记录</h2>
              {selectedSubmissions.length > 0 && (
                <button
                  onClick={rejudgeSelected}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  批量重新评测 ({selectedSubmissions.length})
                </button>
              )}
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
                      <th className="text-left py-3 px-4">时间</th>
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
                        <td className="py-3 px-4">{submission.user.name || submission.user.email}</td>
                        <td className="py-3 px-4 text-gray-400">{submission.problem.title}</td>
                        <td className="py-3 px-4 text-gray-400">{submission.language}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded ${submission.status === 'ACCEPTED' ? 'bg-green-900/50 text-green-400' : submission.status === 'PENDING' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-red-900/50 text-red-400'}`}>
                            {submission.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold">
                          {submission.score !== null ? submission.score : '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          {new Date(submission.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => viewSubmission(submission)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm"
                            >
                              查看
                            </button>
                            <button
                              onClick={() => rejudgeSubmission(submission.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm"
                            >
                              重测
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 详情模态框 */}
          {showDetailModal && selectedSubmission && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4">提交详情</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">选手</div>
                      <div className="font-medium">{selectedSubmission.user.name || selectedSubmission.user.email}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">题目</div>
                      <div className="font-medium">{selectedSubmission.problem.title}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">语言</div>
                      <div className="font-medium">{selectedSubmission.language}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">状态</div>
                      <div className={`font-medium ${selectedSubmission.status === 'ACCEPTED' ? 'text-green-400' : selectedSubmission.status === 'PENDING' ? 'text-yellow-400' : 'text-red-400'}`}>
                        {selectedSubmission.status}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">得分</div>
                      <div className="font-bold text-yellow-400">
                        {selectedSubmission.score !== null ? selectedSubmission.score : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">运行时间</div>
                      <div className="font-medium">
                        {selectedSubmission.runtime !== null ? `${selectedSubmission.runtime}ms` : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">内存使用</div>
                      <div className="font-medium">
                        {selectedSubmission.memory !== null ? `${selectedSubmission.memory}MB` : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">提交时间</div>
                      <div className="font-medium">
                        {new Date(selectedSubmission.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">代码</div>
                    <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                      <pre className="text-sm">{selectedSubmission.code}</pre>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}