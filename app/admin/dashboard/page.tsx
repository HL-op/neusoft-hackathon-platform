import { useEffect, useState } from 'react'
import { PrismaClient } from '../../generated/prisma/client'
import { useSession } from 'next-auth/react'

const prisma = new PrismaClient()

interface DashboardStats {
  totalCompetitions: number
  activeCompetitions: number
  totalProblems: number
  totalParticipants: number
  totalSubmissions: number
  totalAccepted: number
  submissionRate: number
  averageScore: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    totalCompetitions: 0,
    activeCompetitions: 0,
    totalProblems: 0,
    totalParticipants: 0,
    totalSubmissions: 0,
    totalAccepted: 0,
    submissionRate: 0,
    averageScore: 0
  })
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([])
  const [topParticipants, setTopParticipants] = useState<any[]>([])

  // 加载统计数据
  const loadStats = async () => {
    try {
      // 总比赛数
      const totalCompetitions = await prisma.competition.count()
      
      // 活跃比赛数
      const activeCompetitions = await prisma.competition.count({ where: { isActive: true } })
      
      // 总题目数
      const totalProblems = await prisma.problem.count()
      
      // 总参赛人数
      const totalParticipants = await prisma.user.count({ where: { role: 'PARTICIPANT' } })
      
      // 总提交数
      const totalSubmissions = await prisma.submission.count()
      
      // 通过数
      const totalAccepted = await prisma.submission.count({ where: { status: 'ACCEPTED' } })
      
      // 提交通过率
      const submissionRate = totalSubmissions > 0 ? (totalAccepted / totalSubmissions) * 100 : 0
      
      // 平均得分
      const scoreResult = await prisma.$queryRaw<{ avgScore: number }[]>`
        SELECT AVG(COALESCE(score, 0)) as avgScore FROM Submission
      `
      const averageScore = scoreResult[0]?.avgScore || 0
      
      setStats({
        totalCompetitions,
        activeCompetitions,
        totalProblems,
        totalParticipants,
        totalSubmissions,
        totalAccepted,
        submissionRate,
        averageScore
      })

      // 最近提交
      const submissions = await prisma.submission.findMany({
        include: {
          user: { select: { name: true, email: true } },
          problem: { select: { title: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
      setRecentSubmissions(submissions)

      // 排行榜前10
      const topUsers = await prisma.$queryRaw<any[]>`
        SELECT 
          u.id, 
          u.name, 
          u.email, 
          SUM(COALESCE(s.score, 0)) as totalScore
        FROM 
          "User" u
        LEFT JOIN 
          Submission s ON u.id = s.userId
        WHERE 
          u.role = 'PARTICIPANT'
        GROUP BY 
          u.id, u.name, u.email
        ORDER BY 
          totalScore DESC
        LIMIT 10
      `
      setTopParticipants(topUsers)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

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
            仪表盘
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
                <a href="/admin" className="flex items-center gap-3 p-3 rounded-lg bg-blue-900/50 border border-blue-500">
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
          <div className="space-y-6">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">总比赛数</div>
                <div className="text-3xl font-bold text-blue-400">{stats.totalCompetitions}</div>
                <div className="text-sm text-green-400 mt-1">
                  活跃: {stats.activeCompetitions}
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">总题目数</div>
                <div className="text-3xl font-bold text-green-400">{stats.totalProblems}</div>
                <div className="text-sm text-gray-400 mt-1">
                  所有比赛
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">总参赛人数</div>
                <div className="text-3xl font-bold text-yellow-400">{stats.totalParticipants}</div>
                <div className="text-sm text-gray-400 mt-1">
                  选手账号
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">总提交数</div>
                <div className="text-3xl font-bold text-purple-400">{stats.totalSubmissions}</div>
                <div className="text-sm text-green-400 mt-1">
                  通过: {stats.totalAccepted} ({stats.submissionRate.toFixed(1)}%)
                </div>
              </div>
            </div>

            {/* 图表和数据 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 最近提交 */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-semibold mb-3 text-blue-300">最近提交</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {recentSubmissions.map((submission) => (
                    <div key={submission.id} className="bg-gray-900 rounded p-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{submission.user.name || submission.user.email}</span>
                        <span className={`text-sm ${submission.status === 'ACCEPTED' ? 'text-green-400' : 'text-red-400'}`}>
                          {submission.status === 'ACCEPTED' ? '通过' : '未通过'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {submission.problem.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(submission.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 排行榜 */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-semibold mb-3 text-blue-300">排行榜</h3>
                <div className="space-y-2">
                  {topParticipants.map((user, index) => (
                    <div key={user.id} className="bg-gray-900 rounded p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${index < 3 ? 'text-yellow-400' : 'text-gray-400'}`}>
                          {index + 1}
                        </span>
                        <div>
                          <div className="font-medium">{user.name || user.email}</div>
                          <div className="text-xs text-gray-400">{user.email}</div>
                        </div>
                      </div>
                      <span className="text-xl font-bold text-green-400">
                        {user.totalScore}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 系统概览 */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold mb-3 text-blue-300">系统概览</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">平均得分</div>
                  <div className="text-2xl font-bold text-yellow-400">{stats.averageScore.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">提交通过率</div>
                  <div className="text-2xl font-bold text-green-400">{stats.submissionRate.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">系统状态</div>
                  <div className="text-2xl font-bold text-green-400">正常运行</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">数据备份</div>
                  <div className="text-2xl font-bold text-blue-400">最新</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}