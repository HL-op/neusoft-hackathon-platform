import { useEffect, useState, useRef } from 'react'
import { PrismaClient } from '../generated/prisma/client'

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
  competitionId: string
  createdAt: Date
  user: {
    name: string | null
    studentId: string | null
  }
  problem: {
    title: string
  }
}

interface UserScore {
  userId: string
  name: string | null
  studentId: string | null
  totalScore: number
  lastSubmissionTime: Date
}

interface ProblemStats {
  problemId: string
  title: string
  passCount: number
  totalSubmissions: number
  passRate: number
}

interface Competition {
  id: string
  name: string
  startTime: Date
  endTime: Date
  isActive: boolean
}

export default function ScreenPage() {
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [rankings, setRankings] = useState<UserScore[]>([])
  const [problemStats, setProblemStats] = useState<ProblemStats[]>([])
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([])
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const screenRef = useRef<HTMLDivElement>(null)

  // 加载数据
  const loadData = async () => {
    try {
      // 获取当前活跃的比赛
      const activeCompetition = await prisma.competition.findFirst({
        where: { isActive: true }
      })

      if (activeCompetition) {
        setCompetition(activeCompetition)

        // 获取用户总分和最后提交时间
        const userScores = await prisma.$queryRaw<UserScore[]>`
          SELECT 
            s.userId, 
            u.name, 
            u.studentId, 
            SUM(COALESCE(s.score, 0)) as totalScore, 
            MAX(s.createdAt) as lastSubmissionTime
          FROM 
            Submission s
          JOIN 
            "User" u ON s.userId = u.id
          WHERE 
            s.competitionId = ${activeCompetition.id}
          GROUP BY 
            s.userId, u.name, u.studentId
          ORDER BY 
            totalScore DESC, lastSubmissionTime ASC
          LIMIT 20
        `
        setRankings(userScores)

        // 获取题目统计
        const stats = await prisma.$queryRaw<ProblemStats[]>`
          SELECT 
            p.id as problemId, 
            p.title, 
            COUNT(CASE WHEN s.status = 'ACCEPTED' THEN 1 END) as passCount,
            COUNT(s.id) as totalSubmissions,
            CASE 
              WHEN COUNT(s.id) = 0 THEN 0 
              ELSE (COUNT(CASE WHEN s.status = 'ACCEPTED' THEN 1 END) * 100.0) / COUNT(s.id)
            END as passRate
          FROM 
            Problem p
          LEFT JOIN 
            Submission s ON p.id = s.problemId AND s.competitionId = ${activeCompetition.id}
          WHERE 
            p.competitionId = ${activeCompetition.id}
          GROUP BY 
            p.id, p.title
        `
        setProblemStats(stats)

        // 获取最近提交
        const submissions = await prisma.submission.findMany({
          where: { competitionId: activeCompetition.id },
          include: {
            user: { select: { name: true, studentId: true } },
            problem: { select: { title: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        })
        setRecentSubmissions(submissions)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  // 计算倒计时
  useEffect(() => {
    const updateCountdown = () => {
      if (competition) {
        const now = new Date()
        const endTime = new Date(competition.endTime)
        const diff = Math.max(0, endTime.getTime() - now.getTime())

        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)

        setCountdown({ days, hours, minutes, seconds })
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [competition])

  // 自动刷新数据
  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  // 切换全屏
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (screenRef.current?.requestFullscreen) {
        screenRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // 状态颜色映射
  const statusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'text-green-400'
      case 'WRONG_ANSWER': return 'text-red-400'
      case 'TIME_LIMIT_EXCEEDED': return 'text-yellow-400'
      case 'RUNNING': return 'text-blue-400'
      case 'PENDING': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  // 状态文本映射
  const statusText = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return '通过'
      case 'WRONG_ANSWER': return '错误'
      case 'TIME_LIMIT_EXCEEDED': return '超时'
      case 'RUNNING': return '运行中'
      case 'PENDING': return '等待中'
      default: return status
    }
  }

  return (
    <div 
      ref={screenRef}
      className="w-full h-screen bg-gray-900 text-white p-6 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
      }}
    >
      {/* 全屏按钮 */}
      <button
        onClick={toggleFullscreen}
        className="fixed top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-lg z-50"
      >
        {isFullscreen ? '退出全屏' : '全屏显示'}
      </button>

      {/* 顶部：比赛名称 + 倒计时 */}
      <header className="mb-8 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 text-blue-300 animate-pulse">
          {competition?.name || 'AI Hackathon 2026'}
        </h1>
        <div className="flex justify-center items-center gap-4 text-3xl md:text-4xl font-mono">
          <div className="bg-gray-800 rounded-lg px-6 py-3">
            <span className="text-yellow-400">{competition?.isActive ? '剩余时间' : '比赛已结束'}</span>
          </div>
          {competition?.isActive && (
            <>
              <div className="bg-gray-800 rounded-lg px-4 py-2">
                <span className="text-green-400">{countdown.days}</span>
                <span className="text-gray-400 ml-2">天</span>
              </div>
              <div className="bg-gray-800 rounded-lg px-4 py-2">
                <span className="text-green-400">{countdown.hours.toString().padStart(2, '0')}</span>
                <span className="text-gray-400 ml-2">时</span>
              </div>
              <div className="bg-gray-800 rounded-lg px-4 py-2">
                <span className="text-green-400">{countdown.minutes.toString().padStart(2, '0')}</span>
                <span className="text-gray-400 ml-2">分</span>
              </div>
              <div className="bg-gray-800 rounded-lg px-4 py-2">
                <span className="text-green-400">{countdown.seconds.toString().padStart(2, '0')}</span>
                <span className="text-gray-400 ml-2">秒</span>
              </div>
            </>
          )}
        </div>
      </header>

      {/* 主内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 h-[60vh]">
        {/* 左侧：实时排行榜 */}
        <div className="lg:col-span-1 bg-gray-800 rounded-xl p-4 border border-gray-700 overflow-auto">
          <h2 className="text-2xl font-bold mb-4 text-center text-blue-300">实时排行榜</h2>
          <div className="space-y-3">
            {rankings.map((user, index) => (
              <div 
                key={user.userId}
                className="flex items-center justify-between bg-gray-700 rounded-lg p-3 transition-all duration-300 hover:bg-gray-600 animate-fadeIn"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${index < 3 ? 'text-yellow-400' : 'text-gray-300'}`}>
                    {index + 1}
                  </span>
                  <div>
                    <div className="text-xl font-semibold">{user.name || user.studentId}</div>
                    <div className="text-sm text-gray-400">{user.studentId}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">{user.totalScore}</div>
                  <div className="text-sm text-gray-400">
                    {new Date(user.lastSubmissionTime).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：题目得分统计 */}
        <div className="lg:col-span-2 bg-gray-800 rounded-xl p-4 border border-gray-700 overflow-auto">
          <h2 className="text-2xl font-bold mb-4 text-center text-blue-300">题目得分统计</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {problemStats.map((problem) => (
              <div 
                key={problem.problemId}
                className="bg-gray-700 rounded-lg p-4 transition-all duration-300 hover:bg-gray-600 animate-fadeIn"
              >
                <div className="text-xl font-semibold mb-2">{problem.title}</div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-lg">通过人数: <span className="text-green-400 font-bold">{problem.passCount}</span></div>
                    <div className="text-lg">总提交数: <span className="text-blue-400 font-bold">{problem.totalSubmissions}</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-400">
                      {problem.passRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-400">通过率</div>
                  </div>
                </div>
                <div className="mt-3 h-3 bg-gray-600 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-1000 ease-out"
                    style={{ width: `${problem.passRate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部：最近提交记录 */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 h-[20vh] overflow-auto">
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-300">最近提交</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {recentSubmissions.map((submission) => (
            <div 
              key={submission.id}
              className="bg-gray-700 rounded-lg p-3 transition-all duration-300 hover:bg-gray-600 animate-fadeIn"
            >
              <div className="text-sm text-gray-400 mb-1">
                {new Date(submission.createdAt).toLocaleTimeString()}
              </div>
              <div className="font-semibold mb-1">
                {submission.user.name || submission.user.studentId}
              </div>
              <div className="text-sm mb-1 truncate">
                {submission.problem.title}
              </div>
              <div className={`font-bold ${statusColor(submission.status)}`}>
                {statusText(submission.status)}
              </div>
              {submission.score !== null && (
                <div className="text-sm text-yellow-400 mt-1">
                  得分: {submission.score}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        /* 适配不同分辨率 */
        @media screen and (aspect-ratio: 16/9) {
          .text-5xl { font-size: 4rem; }
          .text-2xl { font-size: 1.75rem; }
        }
        
        @media screen and (aspect-ratio: 4/3) {
          .text-5xl { font-size: 3.5rem; }
          .text-2xl { font-size: 1.5rem; }
        }
        
        /* 滚动条样式 */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>
    </div>
  )
}