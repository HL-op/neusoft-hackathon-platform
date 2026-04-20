import { useState, useEffect } from 'react'
import { PrismaClient } from '../../generated/prisma/client'
import { useSession } from 'next-auth/react'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

interface User {
  id: string
  name: string | null
  email: string
  studentId: string | null
  role: string
  createdAt: Date
}

export default function JudgesPage() {
  const { data: session } = useSession()
  const [judges, setJudges] = useState<User[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingJudge, setEditingJudge] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    role: 'JUDGE'
  })

  // 加载评委列表
  const loadJudges = async () => {
    try {
      const judgeList = await prisma.user.findMany({
        where: { role: 'JUDGE' },
        orderBy: { createdAt: 'desc' }
      })
      setJudges(judgeList)
    } catch (error) {
      console.error('Error loading judges:', error)
    }
  }

  useEffect(() => {
    loadJudges()
  }, [])

  // 处理表单变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // 打开创建模态框
  const openCreateModal = () => {
    setEditingJudge(null)
    setFormData({
      name: '',
      email: '',
      password: '',
      studentId: '',
      role: 'JUDGE'
    })
    setShowModal(true)
  }

  // 打开编辑模态框
  const openEditModal = (judge: User) => {
    setEditingJudge(judge)
    setFormData({
      name: judge.name || '',
      email: judge.email,
      password: '',
      studentId: judge.studentId || '',
      role: judge.role
    })
    setShowModal(true)
  }

  // 提交表单
  const submitForm = async () => {
    try {
      if (editingJudge) {
        // 更新评委
        const updateData: any = {
          name: formData.name,
          email: formData.email,
          studentId: formData.studentId,
          role: formData.role
        }
        if (formData.password) {
          updateData.password = await bcrypt.hash(formData.password, 10)
        }
        await prisma.user.update({
          where: { id: editingJudge.id },
          data: updateData
        })
      } else {
        // 创建评委
        const hashedPassword = await bcrypt.hash(formData.password, 10)
        await prisma.user.create({
          data: {
            name: formData.name,
            email: formData.email,
            password: hashedPassword,
            studentId: formData.studentId,
            role: formData.role
          }
        })
      }
      loadJudges()
      setShowModal(false)
    } catch (error) {
      console.error('Error saving judge:', error)
    }
  }

  // 删除评委
  const deleteJudge = async (id: string) => {
    if (confirm('确定要删除这个评委吗？')) {
      try {
        await prisma.user.delete({ where: { id } })
        loadJudges()
      } catch (error) {
        console.error('Error deleting judge:', error)
      }
    }
  }

  // 批量删除
  const [selectedJudges, setSelectedJudges] = useState<string[]>([])
  const toggleSelection = (id: string) => {
    setSelectedJudges(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    )
  }

  const deleteSelected = async () => {
    if (selectedJudges.length === 0) return
    if (confirm(`确定要删除选中的 ${selectedJudges.length} 个评委吗？`)) {
      try {
        for (const id of selectedJudges) {
          await prisma.user.delete({ where: { id } })
        }
        loadJudges()
        setSelectedJudges([])
      } catch (error) {
        console.error('Error deleting judges:', error)
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
            评委管理
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
                <a href="/admin/judges" className="flex items-center gap-3 p-3 rounded-lg bg-blue-900/50 border border-blue-500">
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
              <h2 className="text-xl font-bold">评委列表</h2>
              <div className="flex gap-3">
                {selectedJudges.length > 0 && (
                  <button
                    onClick={deleteSelected}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                  >
                    批量删除 ({selectedJudges.length})
                  </button>
                )}
                <button
                  onClick={openCreateModal}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  添加评委
                </button>
              </div>
            </div>

            {/* 评委列表 */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4">
                        <input
                          type="checkbox"
                          checked={judges.length > 0 && selectedJudges.length === judges.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedJudges(judges.map(j => j.id))
                            } else {
                              setSelectedJudges([])
                            }
                          }}
                          className="rounded text-blue-600"
                        />
                      </th>
                      <th className="text-left py-3 px-4">姓名</th>
                      <th className="text-left py-3 px-4">邮箱</th>
                      <th className="text-left py-3 px-4">学号</th>
                      <th className="text-left py-3 px-4">创建时间</th>
                      <th className="text-left py-3 px-4">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {judges.map((judge) => (
                      <tr key={judge.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedJudges.includes(judge.id)}
                            onChange={() => toggleSelection(judge.id)}
                            className="rounded text-blue-600"
                          />
                        </td>
                        <td className="py-3 px-4 font-medium">{judge.name || judge.email}</td>
                        <td className="py-3 px-4 text-gray-400">{judge.email}</td>
                        <td className="py-3 px-4 text-gray-400">{judge.studentId || '-'}</td>
                        <td className="py-3 px-4 text-gray-400">
                          {new Date(judge.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(judge)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => deleteJudge(judge.id)}
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
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">
                  {editingJudge ? '编辑评委' : '添加评委'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">姓名</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">邮箱</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{editingJudge ? '新密码（留空不修改）' : '密码'}</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                      {...(!editingJudge && { required: true })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">学号</label>
                    <input
                      type="text"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleInputChange}
                      className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                    />
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