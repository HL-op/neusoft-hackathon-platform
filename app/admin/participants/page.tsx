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

export default function ParticipantsPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    role: 'PARTICIPANT'
  })

  // 加载选手列表
  const loadUsers = async () => {
    try {
      const userList = await prisma.user.findMany({
        where: { role: 'PARTICIPANT' },
        orderBy: { createdAt: 'desc' }
      })
      setUsers(userList)
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  useEffect(() => {
    loadUsers()
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
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      password: '',
      studentId: '',
      role: 'PARTICIPANT'
    })
    setShowModal(true)
  }

  // 打开编辑模态框
  const openEditModal = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name || '',
      email: user.email,
      password: '',
      studentId: user.studentId || '',
      role: user.role
    })
    setShowModal(true)
  }

  // 提交表单
  const submitForm = async () => {
    try {
      if (editingUser) {
        // 更新用户
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
          where: { id: editingUser.id },
          data: updateData
        })
      } else {
        // 创建用户
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
      loadUsers()
      setShowModal(false)
    } catch (error) {
      console.error('Error saving user:', error)
    }
  }

  // 删除用户
  const deleteUser = async (id: string) => {
    if (confirm('确定要删除这个用户吗？')) {
      try {
        await prisma.user.delete({ where: { id } })
        loadUsers()
      } catch (error) {
        console.error('Error deleting user:', error)
      }
    }
  }

  // 批量删除
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const toggleSelection = (id: string) => {
    setSelectedUsers(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    )
  }

  const deleteSelected = async () => {
    if (selectedUsers.length === 0) return
    if (confirm(`确定要删除选中的 ${selectedUsers.length} 个用户吗？`)) {
      try {
        for (const id of selectedUsers) {
          await prisma.user.delete({ where: { id } })
        }
        loadUsers()
        setSelectedUsers([])
      } catch (error) {
        console.error('Error deleting users:', error)
      }
    }
  }

  // 导出用户列表
  const exportUsers = async () => {
    try {
      // 这里实现导出Excel功能
      alert('用户列表已导出')
    } catch (error) {
      console.error('Error exporting users:', error)
    }
  }

  // 导入用户
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 这里实现文件上传和解析
      alert('用户导入功能已触发')
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
            选手管理
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
                <a href="/admin/participants" className="flex items-center gap-3 p-3 rounded-lg bg-blue-900/50 border border-blue-500">
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
            <div className="flex flex-wrap justify-between items-center gap-3">
              <h2 className="text-xl font-bold">选手列表</h2>
              <div className="flex flex-wrap gap-3">
                {selectedUsers.length > 0 && (
                  <button
                    onClick={deleteSelected}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                  >
                    批量删除 ({selectedUsers.length})
                  </button>
                )}
                <button
                  onClick={exportUsers}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  导出选手
                </button>
                <label className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg cursor-pointer">
                  导入选手
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={openCreateModal}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                >
                  创建选手
                </button>
              </div>
            </div>

            {/* 选手列表 */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4">
                        <input
                          type="checkbox"
                          checked={users.length > 0 && selectedUsers.length === users.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(users.map(u => u.id))
                            } else {
                              setSelectedUsers([])
                            }
                          }}
                          className="rounded text-blue-600"
                        />
                      </th>
                      <th className="text-left py-3 px-4">姓名</th>
                      <th className="text-left py-3 px-4">邮箱</th>
                      <th className="text-left py-3 px-4">学号</th>
                      <th className="text-left py-3 px-4">角色</th>
                      <th className="text-left py-3 px-4">创建时间</th>
                      <th className="text-left py-3 px-4">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleSelection(user.id)}
                            className="rounded text-blue-600"
                          />
                        </td>
                        <td className="py-3 px-4 font-medium">{user.name || user.email}</td>
                        <td className="py-3 px-4 text-gray-400">{user.email}</td>
                        <td className="py-3 px-4 text-gray-400">{user.studentId || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded ${user.role === 'ADMIN' ? 'bg-red-900/50 text-red-400' : user.role === 'JUDGE' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-green-900/50 text-green-400'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          {new Date(user.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(user)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
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
                  {editingUser ? '编辑选手' : '创建选手'}
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
                    <label className="block text-sm font-medium mb-1">{editingUser ? '新密码（留空不修改）' : '密码'}</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                      {...(!editingUser && { required: true })}
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
                  <div>
                    <label className="block text-sm font-medium mb-1">角色</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                      required
                    >
                      <option value="PARTICIPANT">PARTICIPANT</option>
                      <option value="JUDGE">JUDGE</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
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