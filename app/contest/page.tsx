import { useEffect, useState, useRef } from 'react'
import { PrismaClient } from '../generated/prisma/client'
import { useSession } from 'next-auth/react'

const prisma = new PrismaClient()

interface Problem {
  id: string
  title: string
  description: string
  difficulty: string
  score: number
  timeLimit: number
  memoryLimit: number
  competitionId: string
  testCases: TestCase[]
}

interface TestCase {
  id: string
  input: string
  expectedOutput: string
  isSample: boolean
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
  aiEvaluation?: {
    codeQuality: number
    suggestions: string[]
    estimatedScore: string
  }
}

interface Competition {
  id: string
  name: string
  startTime: Date
  endTime: Date
  isActive: boolean
}

export default function ContestPage() {
  const { data: session } = useSession()
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [problems, setProblems] = useState<Problem[]>([])
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)
  const [activeTab, setActiveTab] = useState('details')
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [testResult, setTestResult] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRunningTest, setIsRunningTest] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [aiEvaluation, setAiEvaluation] = useState<any>(null)

  // 语言配置
  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python3', label: 'Python 3.10' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' }
  ]

  // 难度颜色
  const difficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-400'
      case 'MEDIUM': return 'text-yellow-400'
      case 'HARD': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  // 状态颜色
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

  // 状态文本
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

  // 加载比赛数据
  const loadCompetitionData = async () => {
    try {
      // 获取当前活跃的比赛
      const activeCompetition = await prisma.competition.findFirst({
        where: { isActive: true }
      })

      if (activeCompetition) {
        setCompetition(activeCompetition)

        // 获取比赛题目
        const competitionProblems = await prisma.problem.findMany({
          where: { competitionId: activeCompetition.id },
          include: {
            testCases: { where: { isSample: true } }
          }
        })
        setProblems(competitionProblems)

        // 默认选择第一个题目
        if (competitionProblems.length > 0) {
          setSelectedProblem(competitionProblems[0])
          loadSubmissions(competitionProblems[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading competition data:', error)
    }
  }

  // 加载提交历史
  const loadSubmissions = async (problemId: string) => {
    try {
      if (!session?.user?.email) return

      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })

      if (user) {
        const userSubmissions = await prisma.submission.findMany({
          where: { userId: user.id, problemId },
          orderBy: { createdAt: 'desc' }
        })
        setSubmissions(userSubmissions)
      }
    } catch (error) {
      console.error('Error loading submissions:', error)
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

  // 初始化数据
  useEffect(() => {
    loadCompetitionData()
  }, [session])

  // 当选择题目变化时加载提交历史
  useEffect(() => {
    if (selectedProblem) {
      loadSubmissions(selectedProblem.id)
    }
  }, [selectedProblem])

  // 保存草稿
  const saveDraft = async () => {
    try {
      // 这里可以实现本地存储或服务器存储草稿
      localStorage.setItem(`draft_${selectedProblem?.id}`, code)
      alert('草稿已保存')
    } catch (error) {
      console.error('Error saving draft:', error)
    }
  }

  // 运行测试
  const runTest = async (useCustomInput = false) => {
    if (!selectedProblem) return

    try {
      setIsRunningTest(true)
      
      // 模拟运行测试
      setTimeout(() => {
        setTestResult({
          status: 'ACCEPTED',
          output: 'Hello world',
          expected: 'Hello world',
          runtime: 123,
          memory: 45678
        })
        setIsRunningTest(false)
      }, 1000)
    } catch (error) {
      console.error('Error running test:', error)
      setIsRunningTest(false)
    }
  }

  // 提交代码
  const submitCode = async () => {
    if (!selectedProblem || !session?.user?.email) return

    try {
      setIsSubmitting(true)

      const response = await fetch('/api/submit-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          language,
          problemId: selectedProblem.id,
          timeLimit: selectedProblem.timeLimit,
          memoryLimit: selectedProblem.memoryLimit
        })
      })

      if (response.ok) {
        const submission = await response.json()
        alert('代码提交成功，正在评测中...')
        
        // 定期检查评测结果
        const checkStatus = async () => {
          try {
            const user = await prisma.user.findUnique({
              where: { email: session.user.email }
            })
            
            if (user) {
              const updatedSubmissions = await prisma.submission.findMany({
                where: { userId: user.id, problemId: selectedProblem.id },
                orderBy: { createdAt: 'desc' }
              })
              
              const latestSubmission = updatedSubmissions[0]
              if (latestSubmission && latestSubmission.status !== 'PENDING' && latestSubmission.status !== 'RUNNING') {
                loadSubmissions(selectedProblem.id)
                setIsSubmitting(false)
                // 模拟AI评测
                simulateAIEvaluation()
              } else {
                // 继续检查
                setTimeout(checkStatus, 2000)
              }
            }
          } catch (error) {
            console.error('Error checking submission status:', error)
            setIsSubmitting(false)
          }
        }

        setTimeout(checkStatus, 2000)
      } else {
        const error = await response.json()
        alert('提交失败: ' + error.error)
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Error submitting code:', error)
      alert('提交失败，请重试')
      setIsSubmitting(false)
    }
  }

  // 模拟AI评测
  const simulateAIEvaluation = () => {
    setAiEvaluation({
      codeQuality: 85,
      suggestions: [
        '代码结构清晰，逻辑合理',
        '建议添加更多注释以提高可读性',
        '可以优化时间复杂度',
        '变量命名规范，易于理解'
      ],
      estimatedScore: '80-90'
    })
  }

  // 加载保存的草稿
  useEffect(() => {
    if (selectedProblem) {
      const savedDraft = localStorage.getItem(`draft_${selectedProblem.id}`)
      if (savedDraft) {
        setCode(savedDraft)
      } else {
        // 设置默认代码模板
        setCode(getDefaultCodeTemplate(language))
      }
    }
  }, [selectedProblem, language])

  // 获取默认代码模板
  const getDefaultCodeTemplate = (lang: string) => {
    switch (lang) {
      case 'javascript':
        return 'function solution() {\n  // 你的代码\n  return "Hello world";\n}\n\nconsole.log(solution());'
      case 'python3':
        return 'def solution():\n    # 你的代码\n    return "Hello world"\n\nprint(solution())'
      case 'java':
        return 'public class Main {\n    public static void main(String[] args) {\n        // 你的代码\n        System.out.println("Hello world");\n    }\n}'
      case 'cpp':
        return '#include <iostream>\nusing namespace std;\n\nint main() {\n    // 你的代码\n    cout << "Hello world" << endl;\n    return 0;\n}'
      default:
        return ''
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
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-blue-400">
              {competition?.name || 'AI Hackathon 2026'}
            </h1>
            <div className="text-lg font-mono">
              <span className="text-yellow-400">剩余时间: </span>
              {countdown.days > 0 && `${countdown.days}天 `}
              {countdown.hours.toString().padStart(2, '0')}:{countdown.minutes.toString().padStart(2, '0')}:{countdown.seconds.toString().padStart(2, '0')}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-semibold">{session.user.name || session.user.email}</div>
              <div className="text-sm text-gray-400">{session.user.email}</div>
            </div>
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
              退出
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-72px)]">
        {/* 左侧题目列表 */}
        <aside className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4 text-center text-blue-300">题目列表</h2>
          <div className="space-y-3">
            {problems.map((problem) => {
              const hasAccepted = submissions.some(s => s.status === 'ACCEPTED')
              return (
                <div
                  key={problem.id}
                  onClick={() => setSelectedProblem(problem)}
                  className={`cursor-pointer rounded-lg p-3 transition-all duration-200 ${selectedProblem?.id === problem.id ? 'bg-blue-900/50 border border-blue-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold">{problem.title}</h3>
                    <span className={`text-sm font-bold ${difficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">分值: {problem.score}</span>
                    {hasAccepted && (
                      <span className="text-green-400 font-bold">✓ 已通过</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </aside>

        {/* 右侧主区域 */}
        {selectedProblem && (
          <main className="flex-1 p-6 overflow-y-auto">
            {/* 选项卡 */}
            <div className="border-b border-gray-700 mb-4">
              <div className="flex space-x-4">
                {[
                  { id: 'details', label: '题目详情' },
                  { id: 'editor', label: '代码编辑' },
                  { id: 'test', label: '运行结果' },
                  { id: 'history', label: '提交历史' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === tab.id ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 选项卡内容 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              {/* 题目详情 */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{selectedProblem.title}</h2>
                    <div className="flex gap-4 text-sm">
                      <span className={`font-bold ${difficultyColor(selectedProblem.difficulty)}`}>
                        {selectedProblem.difficulty}
                      </span>
                      <span className="text-gray-400">分值: {selectedProblem.score}</span>
                      <span className="text-gray-400">时间限制: {selectedProblem.timeLimit}ms</span>
                      <span className="text-gray-400">内存限制: {selectedProblem.memoryLimit}MB</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-blue-300">题目描述</h3>
                    <div className="bg-gray-900 rounded p-4 whitespace-pre-wrap">
                      {selectedProblem.description}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-blue-300">样例输入输出</h3>
                    {selectedProblem.testCases.map((testCase, index) => (
                      <div key={testCase.id} className="mb-4">
                        <div className="font-semibold mb-1">样例 {index + 1}:</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-900 rounded p-3">
                            <div className="text-sm text-gray-400 mb-1">输入:</div>
                            <pre className="whitespace-pre-wrap">{testCase.input}</pre>
                          </div>
                          <div className="bg-gray-900 rounded p-3">
                            <div className="text-sm text-gray-400 mb-1">输出:</div>
                            <pre className="whitespace-pre-wrap">{testCase.expectedOutput}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 代码编辑 */}
              {activeTab === 'editor' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-blue-300">代码编辑器</h3>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="bg-gray-700 text-white px-3 py-1 rounded-lg"
                    >
                      {languages.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-4 min-h-[400px]">
                    {/* 这里集成Monaco编辑器 */}
                    {/* 由于环境限制，这里使用textarea作为替代 */}
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full h-[400px] bg-gray-900 text-white font-mono p-4 rounded border border-gray-700 resize-none"
                      placeholder="请输入代码..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={saveDraft}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex-1"
                    >
                      保存草稿
                    </button>
                    <button
                      onClick={() => runTest(false)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex-1"
                      disabled={isRunningTest}
                    >
                      {isRunningTest ? '运行中...' : '运行测试'}
                    </button>
                    <button
                      onClick={submitCode}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex-1"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? '提交中...' : '提交代码'}
                    </button>
                  </div>
                </div>
              )}

              {/* 运行结果 */}
              {activeTab === 'test' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-blue-300">运行结果</h3>

                  <div className="bg-gray-900 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">自定义测试</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">输入数据:</label>
                        <textarea
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          className="w-full h-32 bg-gray-800 text-white font-mono p-3 rounded border border-gray-700 resize-none"
                          placeholder="请输入测试数据..."
                        />
                      </div>
                      <button
                        onClick={() => runTest(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                        disabled={isRunningTest}
                      >
                        {isRunningTest ? '运行中...' : '运行自定义测试'}
                      </button>
                    </div>
                  </div>

                  {testResult && (
                    <div className="bg-gray-900 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">测试结果</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-gray-400">状态: </span>
                          <span className={statusColor(testResult.status)}>
                            {statusText(testResult.status)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">输出: </span>
                          <pre className="whitespace-pre-wrap bg-gray-800 p-2 rounded mt-1">
                            {testResult.output}
                          </pre>
                        </div>
                        <div>
                          <span className="text-gray-400">期望: </span>
                          <pre className="whitespace-pre-wrap bg-gray-800 p-2 rounded mt-1">
                            {testResult.expected}
                          </pre>
                        </div>
                        <div className="flex gap-4">
                          <div><span className="text-gray-400">运行时间: </span>{testResult.runtime}ms</div>
                          <div><span className="text-gray-400">内存使用: </span>{testResult.memory}KB</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI评测结果 */}
                  {aiEvaluation && (
                    <div className="bg-gray-900 rounded-lg p-4">
                      <h4 className="font-semibold mb-2 text-blue-300">AI初评结果</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-gray-400">代码质量评分: </span>
                          <span className="text-yellow-400 font-bold">{aiEvaluation.codeQuality}/100</span>
                        </div>
                        <div>
                          <span className="text-gray-400">预估得分范围: </span>
                          <span className="text-green-400 font-bold">{aiEvaluation.estimatedScore}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">改进建议: </span>
                          <ul className="list-disc list-inside bg-gray-800 p-3 rounded mt-1 space-y-1">
                            {aiEvaluation.suggestions.map((suggestion: string, index: number) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 提交历史 */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-300">提交历史</h3>
                  {submissions.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      暂无提交记录
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {submissions.map((submission) => (
                        <div key={submission.id} className="bg-gray-900 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-3">
                              <span className={statusColor(submission.status)}>
                                {statusText(submission.status)}
                              </span>
                              <span className="text-gray-400 text-sm">
                                {new Date(submission.createdAt).toLocaleString()}
                              </span>
                            </div>
                            {submission.score && (
                              <span className="text-yellow-400 font-bold">得分: {submission.score}</span>
                            )}
                          </div>
                          {submission.runtime && submission.memory && (
                            <div className="text-sm text-gray-400 mb-2">
                              运行时间: {submission.runtime}ms | 内存使用: {submission.memory}KB
                            </div>
                          )}
                          <div className="bg-gray-800 rounded p-2 overflow-auto max-h-24">
                            <pre className="font-mono text-sm whitespace-pre-wrap">
                              {submission.code}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        )}
      </div>
    </div>
  )
}
