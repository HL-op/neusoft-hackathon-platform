import { useState, useEffect } from 'react'
import { PrismaClient } from '../../generated/prisma/client'
import { useSession } from 'next-auth/react'

const prisma = new PrismaClient()

interface Competition {
  id: string
  name: string
  description: string
  startTime: Date
  endTime: Date
  isActive: boolean
  createdAt: Date
}

export default function CompetitionsPage() {
  const { data: session } = useSession()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    isActive: false
  })

  // 加载比赛列表
  const loadCompetitions = async () => {
    try {
      const comps = await prisma.competition.findMany({
        orderBy: { createdAt: 'desc' }
      })
      setCompetitions(comps)
    } catch (error) {
      console.error('Error loading competitions:', error)
    }
  }

  useEffect(() => {
    loadCompetitions()
  }, [])

  // 处理表单变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // 打开创建模态框
  const openCreateModal = () => {
    setEditingCompetition(null)
    setFormData({
      name: '',
      description: '',
      startTime: new Date().toISOString().slice(0, 16),
      endTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      isActive: false
    })
    setShowModal(true)
  }

  // 打开编辑模态框
  const openEditModal = (competition: Competition) => {
    setEditingCompetition(competition)
    setFormData({
      name: competition.name,
      description: competition.description,
      startTime: competition.startTime.toISOString().slice(0, 16),
      endTime: competition.endTime.toISOString().slice(0, 16),
      isActive: competition.isActive
    })
    setShowModal(true)
  }

  // 提交表单
  const submitForm = async () => {
    try {
      if (editingCompetition) {
        // 更新比赛
        await prisma.competition.update({
          where: { id: editingCompetition.id },
          data: {
            name: formData.name,
            description: formData.description,
            startTime: new Date(formData.startTime),
            endTime: new Date(formData.endTime),
            isActive: formData.isActive
          }
        })
      } else {
        // 创建比赛
        await prisma.competition.create({
          data: {
            name: formData.name,
            description: formData.description,
            startTime: new Date(formData.startTime),
            endTime: new Date(formData.endTime),
            isActive: formData.isActive
          }
        })
      }
      loadCompetitions()
      setShowModal(false)
    } catch (error) {
      console.error('Error saving competition:', error)
    }
  }

  // 删除比赛
  const deleteCompetition = async (id: string) => {
    if (confirm('确定要删除这个比赛吗？')) {
      try {
        await prisma.competition.delete({ where: { id } })
        loadCompetitions()
      } catch (error) {
        console.error('Error deleting competition:', error)
      }
    }
  }

  // 批量删除
  const [selectedCompetitions, setSelectedCompetitions] = useState<string[]>([])
  const toggleSelection = (id: string) => {
    setSelectedCompetitions(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    )
  }

  const deleteSelected = async () => {
    if (selectedCompetitions.length === 0) return
    if (confirm(`确定要删除选中的 ${selectedCompetitions.length} 个比赛吗？`)) {
      try {
        for (const id of selectedCompetitions) {
          await prisma.competition.delete({ where: { id } })
        }
        loadCompetitions()
        setSelectedCompetitions([])
      } catch (error) {
        console.error('Error deleting competitions:', error)
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
            比赛管理
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
                <a href="/admin/competitions" className="flex items-center gap-3 p-3 rounded-lg bg-blue-900/50 border border-blue-500">
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
          <div className="space-y-4">
            {/* 操作栏 */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">比赛列表</h2>
              <div className="flex gap-3">
                {selectedCompetitions.length > 0 && (
                  <button
                    onClick={deleteSelected}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                  >
                    批量删除 ({selectedCompetitions.length})
                  </button>
                )}
                <button
                  onClick={openCreateModal}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  创建比赛
                </button>
              </div>
            </div>

            {/* 比赛列表 */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4">
                        <input
                          type="checkbox"
                          checked={competitions.length > 0 && selectedCompetitions.length === competitions.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCompetitions(competitions.map(c => c.id))
                            } else {
                              setSelectedCompetitions([])
                            }
                          }}
                          className="rounded text-blue-600"
                        />
                      </th>
                      <th className="text-left py-3 px-4">名称</th>
                      <th className="text-left py-3 px-4">描述</th>
                      <th className="text-left py-3 px-4">开始时间</th>
                      <th className="text-left py-3 px-4">结束时间</th>
                      <th className="text-left py-3 px-4">状态</th>
                      <th className="text-left py-3 px-4">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitions.map((competition) => (
                      <tr key={competition.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedCompetitions.includes(competition.id)}
                            onChange={() => toggleSelection(competition.id)}
                            className="rounded text-blue-600"
                          />
                        </td>
                        <td className="py-3 px-4 font-medium">{competition.name}</td>
                        <td className="py-3 px-4 text-gray-400">
                          {competition.description.length > 50 
                            ? `${competition.description.substring(0, 50)}...` 
                            : competition.description
                          }
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          {new Date(competition.startTime).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          {new Date(competition.endTime).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded ${competition.isActive ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                            {competition.isActive ? '活跃' : '非活跃'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(competition)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => deleteCompetition(competition.id)}
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
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 w-full max-w-2xl">
                <h3 className="text-xl font-bold mb-4">
                  {editingCompetition ? '编辑比赛' : '创建比赛'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">名称</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
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
                      rows={4}
                      className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">开始时间</label>
                      <input
                        type="datetime-local"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">结束时间</label>
                      <input
                        type="datetime-local"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                      />
                      <span>设为活跃</span>
                    </label>
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