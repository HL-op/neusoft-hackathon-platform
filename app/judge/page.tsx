import { useEffect, useState } from 'react'
import { PrismaClient } from '../generated/prisma/client'
import { useSession } from 'next-auth/react'

const prisma = new PrismaClient()

interface User {
  id: string
  name: string | null
  email: string
  studentId: string | null
  role: string
  totalScore: number
  completedProblems: number
}

interface Submission {
  id: string
  code: string
  language: string
  status: string
  score: number | null
  runtime: number | null
  memory: number | null
  createdAt: Date
  problem: {
    title: string
    difficulty: string
  }
  aiAnalysis?: {
    summary: string
    quality: number
    suggestions: string[]
    plagiarismDetected: boolean
  }
}

interface JudgeScore {
  id: string
  codeQuality: number
  innovation: number
  completion: number
  comment: string
  submissionId: string
  judgeId: string
  createdAt: Date
}

interface Competition {
  id: string
  name: string
  isActive: boolean
}

export default function JudgePage() {
  const { data: session } = useSession()
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [scores, setScores] = useState({
    codeQuality: 10,
    innovation: 10,
    completion: 20,
    presentation: 10
  })
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  // 加载比赛数据
  const loadCompetitionData = async () => {
    try {
      // 获取当前活跃的比赛
      const activeCompetition = await prisma.competition.findFirst({
        where: { isActive: true }
      })

      if (activeCompetition) {
        setCompetition(activeCompetition)
        loadUsers(activeCompetition.id)
      }
    } catch (error) {
      console.error('Error loading competition data:', error)
    }
  }

  // 加载选手列表
  const loadUsers = async (competitionId: string) => {
    try {
      // 获取所有参赛选手及其得分
      const userScores = await prisma.$queryRaw<User[]>`
        SELECT 
          u.id, 
          u.name, 
          u.email, 
          u.studentId, 
          u.role,
          SUM(COALESCE(s.score, 0)) as totalScore,
          COUNT(CASE WHEN s.status = 'ACCEPTED' THEN 1 END) as completedProblems
        FROM 
          "User" u
        LEFT JOIN 
          Submission s ON u.id = s.userId AND s.competitionId = ${competitionId}
        WHERE 
          u.role = 'PARTICIPANT'
        GROUP BY 
          u.id, u.name, u.email, u.studentId, u.role
        ORDER BY 
          totalScore DESC
      `
      setUsers(userScores)
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  // 加载选手提交记录
  const loadSubmissions = async (userId: string) => {
    try {
      if (!competition) return

      const userSubmissions = await prisma.submission.findMany({
        where: { userId, competitionId: competition.id },
        include: {
          problem: { select: { title: true, difficulty: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
      setSubmissions(userSubmissions)

      // 默认选择第一个提交
      if (userSubmissions.length > 0) {
        setSelectedSubmission(userSubmissions[0])
        // 模拟AI分析
        simulateAIAnalysis(userSubmissions[0])
      }
    } catch (error) {
      console.error('Error loading submissions:', error)
    }
  }

  // 模拟AI分析
  const simulateAIAnalysis = (submission: Submission) => {
    setAiAnalysis({
      summary: '该代码实现了一个文本处理工具，使用了高效的算法和清晰的代码结构。代码逻辑正确，能够处理各种输入情况。',
      quality: 85,
      suggestions: [
        '代码结构清晰，逻辑合理',
        '建议添加更多注释以提高可读性',
        '可以优化时间复杂度',
        '变量命名规范，易于理解'
      ],
      plagiarismDetected: false
    })
  }

  // 提交评分
  const submitScore = async () => {
    if (!selectedSubmission || !session?.user?.email) return

    try {
      setIsSubmitting(true)

      const judge = await prisma.user.findUnique({
        where: { email: session.user.email }
      })

      if (judge) {
        // 检查是否已存在评分
        const existingScore = await prisma.judgeScore.findFirst({
          where: { submissionId: selectedSubmission.id, judgeId: judge.id }
        })

        if (existingScore) {
          // 更新评分
          await prisma.judgeScore.update({
            where: { id: existingScore.id },
            data: {
              codeQuality: scores.codeQuality,
              innovation: scores.innovation,
              completion: scores.completion,
              comment: comment
            }
          })
        } else {
          // 创建新评分
          await prisma.judgeScore.create({
            data: {
              codeQuality: scores.codeQuality,
              innovation: scores.innovation,
              completion: scores.completion,
              comment: comment,
              submissionId: selectedSubmission.id,
              judgeId: judge.id
            }
          })
        }

        alert('评分已提交')
      }
    } catch (error) {
      console.error('Error submitting score:', error)
    } finally {
      setIsSubmitting(false)
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

  // 批量评分
  const batchScore = async () => {
    try {
      // 这里实现批量评分功能
      alert('批量评分已完成')
    } catch (error) {
      console.error('Error batch scoring:', error)
    }
  }

  // 初始化数据
  useEffect(() => {
    loadCompetitionData()
  }, [session])

  // 当选择选手变化时加载提交记录
  useEffect(() => {
    if (selectedUser) {
      loadSubmissions(selectedUser.id)
    }
  }, [selectedUser])

  // 当选择提交变化时加载AI分析
  useEffect(() => {
    if (selectedSubmission) {
      simulateAIAnalysis(selectedSubmission)
    }
  }, [selectedSubmission])

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
            评委评分系统 - {competition?.name || 'AI Hackathon 2026'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-semibold">{session.user.name || session.user.email}</div>
              <div className="text-sm text-gray-400">评委</div>
            </div>
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
              退出
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-72px)]">
        {/* 左侧选手列表 */}
        <aside className="w-96 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-center text-blue-300">选手列表</h2>
            <div className="flex gap-2">
              <button
                onClick={batchScore}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm"
              >
                批量评分
              </button>
              <button
                onClick={exportScores}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm"
              >
                导出评分表
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`cursor-pointer rounded-lg p-3 transition-all duration-200 ${selectedUser?.id === user.id ? 'bg-blue-900/50 border border-blue-500' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold">{user.name || user.email}</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id])
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                        }
                      }}
                      className="rounded text-blue-600"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">学号: {user.studentId}</span>
                  <span className="text-green-400">已完成: {user.completedProblems}</span>
                </div>
                <div className="mt-1 text-right">
                  <span className="text-yellow-400 font-bold">总分: {user.totalScore}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* 右侧主区域 */}
        {selectedUser && (
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
              {/* 选手信息 */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h2 className="text-xl font-bold mb-2">
                  {selectedUser.name || selectedUser.email}
                </h2>
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-400">学号: {selectedUser.studentId}</span>
                  <span className="text-green-400">已完成题目: {selectedUser.completedProblems}</span>
                  <span className="text-yellow-400">总分: {selectedUser.totalScore}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 左侧：提交列表和代码查看 */}
                <div className="space-y-4">
                  {/* 提交列表 */}
                  <div className="bg-gray-900 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 text-blue-300">提交记录</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {submissions.map((submission) => (
                        <div
                          key={submission.id}
                          onClick={() => setSelectedSubmission(submission)}
                          className={`cursor-pointer rounded p-2 transition-all duration-200 ${selectedSubmission?.id === submission.id ? 'bg-blue-900/30 border border-blue-500' : 'bg-gray-800 hover:bg-gray-700'}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{submission.problem.title}</span>
                            <span className={`text-sm ${submission.status === 'ACCEPTED' ? 'text-green-400' : 'text-red-400'}`}>
                              {submission.status === 'ACCEPTED' ? '通过' : '未通过'}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>{submission.language}</span>
                            <span>{new Date(submission.createdAt).toLocaleString()}</span>
                          </div>
                          {submission.score && (
                            <div className="text-xs text-yellow-400 mt-1">
                              得分: {submission.score}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 代码查看器 */}
                  {selectedSubmission && (
                    <div className="bg-gray-900 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-3 text-blue-300">代码查看</h3>
                      <div className="bg-gray-800 rounded p-4 max-h-96 overflow-auto font-mono text-sm">
                        <pre className="whitespace-pre-wrap">{selectedSubmission.code}</pre>
                      </div>
                      {aiAnalysis?.plagiarismDetected && (
                        <div className="mt-3 p-2 bg-red-900/30 border border-red-500 rounded">
                          <span className="text-red-400 font-bold">⚠️ 检测到可能的抄袭行为</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 右侧：AI分析和评分表单 */}
                <div className="space-y-4">
                  {/* AI分析结果 */}
                  {aiAnalysis && (
                    <div className="bg-gray-900 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-3 text-blue-300">AI分析结果</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-gray-400">代码摘要: </span>
                          <p className="mt-1 bg-gray-800 p-2 rounded">{aiAnalysis.summary}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">代码质量: </span>
                          <span className="text-yellow-400 font-bold">{aiAnalysis.quality}/100</span>
                        </div>
                        <div>
                          <span className="text-gray-400">改进建议: </span>
                          <ul className="mt-1 bg-gray-800 p-2 rounded list-disc list-inside space-y-1">
                            {aiAnalysis.suggestions.map((suggestion: string, index: number) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 评分表单 */}
                  <div className="bg-gray-900 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 text-blue-300">评分</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">代码质量 (20分)</label>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={scores.codeQuality}
                          onChange={(e) => setScores({ ...scores, codeQuality: parseInt(e.target.value) })}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-sm text-gray-400 mt-1">
                          <span>0</span>
                          <span>{scores.codeQuality}</span>
                          <span>20</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">创新性 (20分)</label>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={scores.innovation}
                          onChange={(e) => setScores({ ...scores, innovation: parseInt(e.target.value) })}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-sm text-gray-400 mt-1">
                          <span>0</span>
                          <span>{scores.innovation}</span>
                          <span>20</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">完成度 (40分)</label>
                        <input
                          type="range"
                          min="0"
                          max="40"
                          value={scores.completion}
                          onChange={(e) => setScores({ ...scores, completion: parseInt(e.target.value) })}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-sm text-gray-400 mt-1">
                          <span>0</span>
                          <span>{scores.completion}</span>
                          <span>40</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">演示效果 (20分)</label>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={scores.presentation}
                          onChange={(e) => setScores({ ...scores, presentation: parseInt(e.target.value) })}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-sm text-gray-400 mt-1">
                          <span>0</span>
                          <span>{scores.presentation}</span>
                          <span>20</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-blue-900/20 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">总分</span>
                          <span className="text-2xl font-bold text-yellow-400">
                            {scores.codeQuality + scores.innovation + scores.completion + scores.presentation}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">评语</label>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="w-full h-32 bg-gray-800 text-white p-3 rounded border border-gray-700 resize-none"
                          placeholder="请输入评语..."
                        />
                      </div>
                      
                      <button
                        onClick={submitScore}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? '提交中...' : '提交评分'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  )
}