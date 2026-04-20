import { useState, useEffect } from 'react'
import { PrismaClient } from '../../generated/prisma/client'
import { useSession } from 'next-auth/react'

const prisma = new PrismaClient()

interface JudgeScore {
  id: string
  codeQuality: number
  innovation: number
  completion: number
  comment: string
  submissionId: string
  judgeId: string
  createdAt: Date
  submission: {
    id: string
    code: string
    language: string
    user: {
      name: string | null
      email: string
    }
    problem: {
      title: string
    }
  }
  judge: {
    name: string | null
    email: string
  }
}

export default function ScoresPage() {
  const { data: session } = useSession()
  const [scores, setScores] = useState<JudgeScore[]>([])
  const [selectedScore, setSelectedScore] = useState<JudgeScore | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [formData, setFormData] = useState({
    codeQuality: 0,
    innovation: 0,
    completion: 0,
    comment: ''
  })

  // 加载评分列表
  const loadScores = async () => {
    try {
      const scoreList = await prisma.judgeScore.findMany({
        include: {
          submission: {
            include: {
              user: { select: { name: true, email: true } },
              problem: { select: { title: true } }
            }
          },
          judge: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
      setScores(scoreList)
    } catch (error) {
      console.error('Error loading scores:', error)
    }
  }

  useEffect(() => {
    loadScores()
  }, [])

  // 查看评分详情
  const viewScore = (score: JudgeScore) => {
    setSelectedScore(score)
    setFormData({
      codeQuality: score.codeQuality,
      innovation: score.innovation,
      completion: score.completion,
      comment: score.comment
    })
    setShowDetailModal(true)
  }

  // 处理表单变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }))
  }

  // 保存评分修改
  const saveScore = async () => {
    if (!selectedScore) return
    try {
      await prisma.judgeScore.update({
        where: { id: selectedScore.id },
        data: {
          codeQuality: formData.codeQuality,
          innovation: formData.innovation,
          completion: formData.completion,
          comment: formData.comment
        }
      })
      loadScores()
      setShowDetailModal(false)
    } catch (error) {
      console.error('Error saving score:', error)
    }
  }

  // 导出评分表
  const exportScores = async () => {
    try {
      // 这里实现导出Excel功能
      alert('评分表已导出')
    } catch (error) {
      console.error('Error exporting scores:', error)
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
            评分管理
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
                <a href="/admin/submissions" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700">
                  <span className="text-xl">📤</span>
                  <span>提交管理</span>
                </a>
              </li>
              <li>
                <a href="/admin/scores" className="flex items-center gap-3 p-3 rounded-lg bg-blue-900/50 border border-blue-500">
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
              <h2 className="text-xl font-bold">评分列表</h2>
              <button
                onClick={exportScores}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                导出评分表
              </button>
            </div>

            {/* 评分列表 */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4">选手</th>
                      <th className="text-left py-3 px-4">题目</th>
                      <th className="text-left py-3 px-4">评委</th>
                      <th className="text-left py-3 px-4">代码质量</th>
                      <th className="text-left py-3 px-4">创新性</th>
                      <th className="text-left py-3 px-4">完成度</th>
                      <th className="text-left py-3 px-4">总分</th>
                      <th className="text-left py-3 px-4">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.map((score) => {
                      const totalScore = score.codeQuality + score.innovation + score.completion
                      return (
                        <tr key={score.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                          <td className="py-3 px-4">{score.submission.user.name || score.submission.user.email}</td>
                          <td className="py-3 px-4 text-gray-400">{score.submission.problem.title}</td>
                          <td className="py-3 px-4 text-gray-400">{score.judge.name || score.judge.email}</td>
                          <td className="py-3 px-4">{score.codeQuality}</td>
                          <td className="py-3 px-4">{score.innovation}</td>
                          <td className="py-3 px-4">{score.completion}</td>
                          <td className="py-3 px-4 font-bold text-yellow-400">{totalScore}</td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => viewScore(score)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm"
                            >
                              查看/编辑
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 详情模态框 */}
          {showDetailModal && selectedScore && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4">评分详情</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">选手</div>
                      <div className="font-medium">{selectedScore.submission.user.name || selectedScore.submission.user.email}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">题目</div>
                      <div className="font-medium">{selectedScore.submission.problem.title}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">评委</div>
                      <div className="font-medium">{selectedScore.judge.name || selectedScore.judge.email}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">评分时间</div>
                      <div className="font-medium">
                        {new Date(selectedScore.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">代码质量 (0-20)</label>
                      <input
                        type="number"
                        name="codeQuality"
                        value={formData.codeQuality}
                        onChange={handleInputChange}
                        min="0"
                        max="20"
                        className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">创新性 (0-20)</label>
                      <input
                        type="number"
                        name="innovation"
                        value={formData.innovation}
                        onChange={handleInputChange}
                        min="0"
                        max="20"
                        className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">完成度 (0-60)</label>
                      <input
                        type="number"
                        name="completion"
                        value={formData.completion}
                        onChange={handleInputChange}
                        min="0"
                        max="60"
                        className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">评语</label>
                    <textarea
                      name="comment"
                      value={formData.comment}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                    />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">代码</div>
                    <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                      <pre className="text-sm">{selectedScore.submission.code}</pre>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                  >
                    取消
                  </button>
                  <button
                    onClick={saveScore}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                  >
                    保存
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