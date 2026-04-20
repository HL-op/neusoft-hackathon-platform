import { useState, useEffect } from 'react'
import { PrismaClient } from '../../generated/prisma/client'
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
  createdAt: Date
  competition: {
    name: string
  }
  testCases: {
    id: string
    isSample: boolean
  }[]
}

interface Competition {
  id: string
  name: string
}

export default function ProblemsPage() {
  const { data: session } = useSession()
  const [problems, setProblems] = useState<Problem[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'MEDIUM',
    score: 100,
    timeLimit: 1000,
    memoryLimit: 256,
    competitionId: ''
  })
  const [testCases, setTestCases] = useState<{ input: string; expectedOutput: string; isSample: boolean }[]>([])

  // 加载比赛列表
  const loadCompetitions = async () => {
    try {
      const comps = await prisma.competition.findMany()
      setCompetitions(comps)
      if (comps.length > 0 && !formData.competitionId) {
        setFormData(prev => ({ ...prev, competitionId: comps[0].id }))
      }
    } catch (error) {
      console.error('Error loading competitions:', error)
    }
  }

  // 加载题目列表
  const loadProblems = async () => {
    try {
      const probs = await prisma.problem.findMany({
        include: {
          competition: { select: { name: true } },
          testCases: { select: { id: true, isSample: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
      setProblems(probs)
    } catch (error) {
      console.error('Error loading problems:', error)
    }
  }

  useEffect(() => {
    loadCompetitions()
    loadProblems()
  }, [])

  // 处理表单变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // 处理测试用例变化
  const handleTestCaseChange = (index: number, field: string, value: string | boolean) => {
    const newTestCases = [...testCases]
    newTestCases[index] = {
      ...newTestCases[index],
      [field]: value
    }
    setTestCases(newTestCases)
  }

  // 添加测试用例
  const addTestCase = () => {
    setTestCases([...testCases, { input: '', expectedOutput: '', isSample: false }])
  }

  // 删除测试用例
  const removeTestCase = (index: number) => {
    const newTestCases = testCases.filter((_, i) => i !== index)
    setTestCases(newTestCases)
  }

  // 打开创建模态框
  const openCreateModal = () => {
    setEditingProblem(null)
    setFormData({
      title: '',
      description: '',
      difficulty: 'MEDIUM',
      score: 100,
      timeLimit: 1000,
      memoryLimit: 256,
      competitionId: competitions[0]?.id || ''
    })
    setTestCases([])
    setShowModal(true)
  }

  // 打开编辑模态框
  const openEditModal = async (problem: Problem) => {
    setEditingProblem(problem)
    setFormData({
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      score: problem.score,
      timeLimit: problem.timeLimit,
      memoryLimit: problem.memoryLimit,
      competitionId: problem.competitionId
    })
    // 加载测试用例
    const cases = await prisma.testCase.findMany({
      where: { problemId: problem.id }
    })
    setTestCases(cases.map(c => ({ input: c.input, expectedOutput: c.expectedOutput, isSample: c.isSample })))
    setShowModal(true)
  }

  // 提交表单
  const submitForm = async () => {
    try {
      if (editingProblem) {
        // 更新题目
        await prisma.problem.update({
          where: { id: editingProblem.id },
          data: {
            title: formData.title,
            description: formData.description,
            difficulty: formData.difficulty,
            score: formData.score,
            timeLimit: formData.timeLimit,
            memoryLimit: formData.memoryLimit,
            competitionId: formData.competitionId
          }
        })
        // 删除旧测试用例
        await prisma.testCase.deleteMany({ where: { problemId: editingProblem.id } })
      } else {
        // 创建题目
        const problem = await prisma.problem.create({
          data: {
            title: formData.title,
            description: formData.description,
            difficulty: formData.difficulty,
            score: formData.score,
            timeLimit: formData.timeLimit,
            memoryLimit: formData.memoryLimit,
            competitionId: formData.competitionId
          }
        })
        // 创建测试用例
        for (const testCase of testCases) {
          await prisma.testCase.create({
            data: {
              input: testCase.input,
              expectedOutput: testCase.expectedOutput,
              isSample: testCase.isSample,
              problemId: editingProblem?.id || problem.id
            }
          })
        }
      }
      loadProblems()
      setShowModal(false)
    } catch (error) {
      console.error('Error saving problem:', error)
    }
  }

  // 删除题目
  const deleteProblem = async (id: string) => {
    if (confirm('确定要删除这个题目吗？')) {
      try {
        await prisma.problem.delete({ where: { id } })
        loadProblems()
      } catch (error) {
        console.error('Error deleting problem:', error)
      }
    }
  }

  // 批量删除
  const [selectedProblems, setSelectedProblems] = useState<string[]>([])
  const toggleSelection = (id: string) => {
    setSelectedProblems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    )
  }

  const deleteSelected = async () => {
    if (selectedProblems.length === 0) return
    if (confirm(`确定要删除选中的 ${selectedProblems.length} 个题目吗？`)) {
      try {
        for (const id of selectedProblems) {
          await prisma.problem.delete({ where: { id } })
        }
        loadProblems()
        setSelectedProblems([])
      } catch (error) {
        console.error('Error deleting problems:', error)
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
            题目管理
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
                <a href="/admin/problems" className="flex items-center gap-3 p-3 rounded-lg bg-blue-900/50 border border-blue-500">
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
          <div className="space-y-4">
            {/* 操作栏 */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">题目列表</h2>
              <div className="flex gap-3">
                {selectedProblems.length > 0 && (
                  <button
                    onClick={deleteSelected}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                  >
                    批量删除 ({selectedProblems.length})
                  </button>
                )}
                <button
                  onClick={openCreateModal}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  创建题目
                </button>
              </div>
            </div>

            {/* 题目列表 */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4">
                        <input
                          type="checkbox"
                          checked={problems.length > 0 && selectedProblems.length === problems.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProblems(problems.map(p => p.id))
                            } else {
                              setSelectedProblems([])
                            }
                          }}
                          className="rounded text-blue-600"
                        />
                      </th>
                      <th className="text-left py-3 px-4">标题</th>
                      <th className="text-left py-3 px-4">比赛</th>
                      <th className="text-left py-3 px-4">难度</th>
                      <th className="text-left py-3 px-4">分值</th>
                      <th className="text-left py-3 px-4">测试用例</th>
                      <th className="text-left py-3 px-4">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems.map((problem) => (
                      <tr key={problem.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedProblems.includes(problem.id)}
                            onChange={() => toggleSelection(problem.id)}
                            className="rounded text-blue-600"
                          />
                        </td>
                        <td className="py-3 px-4 font-medium">{problem.title}</td>
                        <td className="py-3 px-4 text-gray-400">{problem.competition.name}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded ${problem.difficulty === 'EASY' ? 'bg-green-900/50 text-green-400' : problem.difficulty === 'MEDIUM' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-red-900/50 text-red-400'}`}>
                            {problem.difficulty}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-yellow-400 font-bold">{problem.score}</td>
                        <td className="py-3 px-4 text-gray-400">
                          {problem.testCases.length} 个 ({problem.testCases.filter(tc => tc.isSample).length} 个样例)
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(problem)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => deleteProblem(problem.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm"
                            >
                              删除
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

          {/* 模态框 */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4">
                  {editingProblem ? '编辑题目' : '创建题目'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">标题</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">描述</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={6}
                      className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">比赛</label>
                      <select
                        name="competitionId"
                        value={formData.competitionId}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                        required
                      >
                        {competitions.map(comp => (
                          <option key={comp.id} value={comp.id}>
                            {comp.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">难度</label>
                      <select
                        name="difficulty"
                        value={formData.difficulty}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                        required
                      >
                        <option value="EASY">EASY</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HARD">HARD</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">分值</label>
                      <input
                        type="number"
                        name="score"
                        value={formData.score}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">时间限制 (ms)</label>
                      <input
                        type="number"
                        name="timeLimit"
                        value={formData.timeLimit}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">内存限制 (MB)</label>
                      <input
                        type="number"
                        name="memoryLimit"
                        value={formData.memoryLimit}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium">测试用例</label>
                      <button
                        onClick={addTestCase}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm"
                      >
                        添加测试用例
                      </button>
                    </div>
                    {testCases.map((testCase, index) => (
                      <div key={index} className="bg-gray-900 rounded p-4 mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">测试用例 {index + 1}</span>
                          <button
                            onClick={() => removeTestCase(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            删除
                          </button>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">输入</label>
                            <textarea
                              value={testCase.input}
                              onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                              rows={3}
                              className="w-full bg-gray-800 text-white p-2 rounded border border-gray-700"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">期望输出</label>
                            <textarea
                              value={testCase.expectedOutput}
                              onChange={(e) => handleTestCaseChange(index, 'expectedOutput', e.target.value)}
                              rows={3}
                              className="w-full bg-gray-800 text-white p-2 rounded border border-gray-700"
                              required
                            />
                          </div>
                          <div>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={testCase.isSample}
                                onChange={(e) => handleTestCaseChange(index, 'isSample', e.target.checked)}
                              />
                              <span className="text-sm">设为样例</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                  >
                    取消
                  </button>
                  <button
                    onClick={submitForm}
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