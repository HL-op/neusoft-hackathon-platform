import { useState, useEffect } from 'react'
import { PrismaClient } from '../../generated/prisma/client'
import { useSession } from 'next-auth/react'

const prisma = new PrismaClient()

interface ReportData {
  totalSubmissions: number
  acceptedSubmissions: number
  submissionRate: number
  averageScore: number
  topProblems: Array<{
    title: string
    submissionCount: number
    acceptanceRate: number
  }>
  topUsers: Array<{
    name: string
    email: string
    totalScore: number
    submissionCount: number
  }>
  dailySubmissions: Array<{
    date: string
    count: number
  }>
}

export default function ReportsPage() {
  const { data: session } = useSession()
  const [reportData, setReportData] = useState<ReportData>({
    totalSubmissions: 0,
    acceptedSubmissions: 0,
    submissionRate: 0,
    averageScore: 0,
    topProblems: [],
    topUsers: [],
    dailySubmissions: []
  })
  const [selectedCompetition, setSelectedCompetition] = useState<string>('')
  const [competitions, setCompetitions] = useState<Array<{ id: string; name: string }>>([])

  // 加载比赛列表
  const loadCompetitions = async () => {
    try {
      const comps = await prisma.competition.findMany()
      setCompetitions(comps)
      if (comps.length > 0) {
        setSelectedCompetition(comps[0].id)
      }
    } catch (error) {
      console.error('Error loading competitions:', error)
    }
  }

  // 加载报表数据
  const loadReportData = async () => {
    try {
      // 总提交数
      const totalSubmissions = await prisma.submission.count()
      
      // 通过数
      const acceptedSubmissions = await prisma.submission.count({ where: { status: 'ACCEPTED' } })
      
      // 提交通过率
      const submissionRate = totalSubmissions > 0 ? (acceptedSubmissions / totalSubmissions) * 100 : 0
      
      // 平均得分
      const scoreResult = await prisma.$queryRaw<{ avgScore: number }[]>`
        SELECT AVG(COALESCE(score, 0)) as avgScore FROM Submission
      `
      const averageScore = scoreResult[0]?.avgScore || 0
      
      // 题目统计
      const problemStats = await prisma.$queryRaw<any[]>`
        SELECT 
          p.title, 
          COUNT(s.id) as submissionCount,
          SUM(CASE WHEN s.status = 'ACCEPTED' THEN 1 ELSE 0 END) as acceptedCount
        FROM 
          "Problem" p
        LEFT JOIN 
          Submission s ON p.id = s.problemId
        GROUP BY 
          p.id, p.title
        ORDER BY 
          submissionCount DESC
        LIMIT 10
      `
      
      const topProblems = problemStats.map(p => ({
        title: p.title,
        submissionCount: p.submissionCount,
        acceptanceRate: p.submissionCount > 0 ? (p.acceptedCount / p.submissionCount) * 100 : 0
      }))
      
      // 用户统计
      const userStats = await prisma.$queryRaw<any[]>`
        SELECT 
          u.name, 
          u.email, 
          SUM(COALESCE(s.score, 0)) as totalScore,
          COUNT(s.id) as submissionCount
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
      
      const topUsers = userStats.map(u => ({
        name: u.name || u.email,
        email: u.email,
        totalScore: u.totalScore,
        submissionCount: u.submissionCount
      }))
      
      // 每日提交统计
      const dailyStats = await prisma.$queryRaw<any[]>`
        SELECT 
          DATE(createdAt) as date, 
          COUNT(*) as count
        FROM 
          Submission
        GROUP BY 
          DATE(createdAt)
        ORDER BY 
          date
      `
      
      const dailySubmissions = dailyStats.map(d => ({
        date: d.date,
        count: d.count
      }))
      
      setReportData({
        totalSubmissions,
        acceptedSubmissions,
        submissionRate,
        averageScore,
        topProblems,
        topUsers,
        dailySubmissions
      })
    } catch (error) {
      console.error('Error loading report data:', error)
    }
  }

  useEffect(() => {
    loadCompetitions()
    loadReportData()
  }, [selectedCompetition])

  // 导出报表
  const exportReport = async (format: 'excel' | 'pdf') => {
    try {
      // 这里实现导出功能
      alert(`${format === 'excel' ? 'Excel' : 'PDF'} 报表已导出`)
    } catch (error) {
      console.error('Error exporting report:', error)
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
            统计报表
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
                <a href="/admin/scores" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700">
                  <span className="text-xl">⭐</span>
                  <span>评分管理</span>
                </a>
              </li>
              <li>
                <a href="/admin/reports" className="flex items-center gap-3 p-3 rounded-lg bg-blue-900/50 border border-blue-500">
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
            {/* 操作栏 */}
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="text-xl font-bold mb-2">统计报表</h2>
                <select
                  value={selectedCompetition}
                  onChange={(e) => setSelectedCompetition(e.target.value)}
                  className="bg-gray-800 text-white p-2 rounded border border-gray-700"
                >
                  {competitions.map(comp => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => exportReport('excel')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  导出 Excel
                </button>
                <button
                  onClick={() => exportReport('pdf')}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                >
                  导出 PDF
                </button>
              </div>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">总提交数</div>
                <div className="text-3xl font-bold text-blue-400">{reportData.totalSubmissions}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">通过数</div>
                <div className="text-3xl font-bold text-green-400">{reportData.acceptedSubmissions}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">通过率</div>
                <div className="text-3xl font-bold text-yellow-400">{reportData.submissionRate.toFixed(1)}%</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">平均得分</div>
                <div className="text-3xl font-bold text-purple-400">{reportData.averageScore.toFixed(1)}</div>
              </div>
            </div>

            {/* 图表和数据 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 题目统计 */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-semibold mb-3 text-blue-300">题目统计</h3>
                <div className="space-y-2">
                  {reportData.topProblems.map((problem, index) => (
                    <div key={index} className="bg-gray-900 rounded p-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{problem.title}</span>
                        <span className="text-sm text-gray-400">
                          {problem.submissionCount} 次提交
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${problem.acceptanceRate}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-400 mt-1 text-right">
                          通过率: {problem.acceptanceRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 用户统计 */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-semibold mb-3 text-blue-300">用户统计</h3>
                <div className="space-y-2">
                  {reportData.topUsers.map((user, index) => (
                    <div key={index} className="bg-gray-900 rounded p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-gray-400">{user.email}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-yellow-400">{user.totalScore}</div>
                          <div className="text-xs text-gray-400">{user.submissionCount} 次提交</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 每日提交统计 */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold mb-3 text-blue-300">每日提交统计</h3>
              <div className="space-y-2">
                {reportData.dailySubmissions.map((day, index) => (
                  <div key={index} className="bg-gray-900 rounded p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{day.date}</span>
                      <span className="text-lg font-bold text-blue-400">{day.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}