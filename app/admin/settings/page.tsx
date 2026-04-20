import { useState, useEffect } from 'react'
import { PrismaClient } from '../../generated/prisma/client'
import { useSession } from 'next-auth/react'

const prisma = new PrismaClient()

interface SystemSetting {
  id: string
  key: string
  value: string
  description: string
  createdAt: Date
  updatedAt: Date
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [formData, setFormData] = useState<{ [key: string]: string }>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [newSetting, setNewSetting] = useState({
    key: '',
    value: '',
    description: ''
  })

  // 加载系统设置
  const loadSettings = async () => {
    try {
      const settingList = await prisma.systemSetting.findMany()
      setSettings(settingList)
      
      // 构建表单数据
      const formDataObj: { [key: string]: string } = {}
      settingList.forEach(setting => {
        formDataObj[setting.key] = setting.value
      })
      setFormData(formDataObj)
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  // 处理表单变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // 处理新设置表单变化
  const handleNewSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewSetting(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // 保存设置
  const saveSetting = async (key: string, value: string) => {
    try {
      const setting = settings.find(s => s.key === key)
      if (setting) {
        // 更新设置
        await prisma.systemSetting.update({
          where: { id: setting.id },
          data: { value }
        })
      } else {
        // 创建设置
        await prisma.systemSetting.create({
          data: {
            key,
            value,
            description: key
          }
        })
      }
      loadSettings()
    } catch (error) {
      console.error('Error saving setting:', error)
    }
  }

  // 添加新设置
  const addSetting = async () => {
    try {
      await prisma.systemSetting.create({
        data: newSetting
      })
      loadSettings()
      setShowAddModal(false)
      setNewSetting({ key: '', value: '', description: '' })
    } catch (error) {
      console.error('Error adding setting:', error)
    }
  }

  // 删除设置
  const deleteSetting = async (id: string) => {
    if (confirm('确定要删除这个设置吗？')) {
      try {
        await prisma.systemSetting.delete({ where: { id } })
        loadSettings()
      } catch (error) {
        console.error('Error deleting setting:', error)
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
            系统设置
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
                <a href="/admin/reports" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700">
                  <span className="text-xl">📈</span>
                  <span>统计报表</span>
                </a>
              </li>
              <li>
                <a href="/admin/settings" className="flex items-center gap-3 p-3 rounded-lg bg-blue-900/50 border border-blue-500">
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
              <h2 className="text-xl font-bold">系统设置</h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                添加设置
              </button>
            </div>

            {/* 设置列表 */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="space-y-4">
                {settings.map((setting) => (
                  <div key={setting.id} className="bg-gray-900 rounded p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-blue-300">{setting.key}</h3>
                        <p className="text-sm text-gray-400 mt-1">{setting.description}</p>
                      </div>
                      <button
                        onClick={() => deleteSetting(setting.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        删除
                      </button>
                    </div>
                    <div className="mt-3">
                      <input
                        type="text"
                        name={setting.key}
                        value={formData[setting.key] || ''}
                        onChange={handleInputChange}
                        onBlur={(e) => saveSetting(setting.key, e.target.value)}
                        className="w-full bg-gray-800 text-white p-2 rounded border border-gray-700"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 添加设置模态框 */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">添加设置</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">键</label>
                    <input
                      type="text"
                      name="key"
                      value={newSetting.key}
                      onChange={handleNewSettingChange}
                      className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">值</label>
                    <input
                      type="text"
                      name="value"
                      value={newSetting.value}
                      onChange={handleNewSettingChange}
                      className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">描述</label>
                    <textarea
                      name="description"
                      value={newSetting.description}
                      onChange={handleNewSettingChange}
                      rows={3}
                      className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                  >
                    取消
                  </button>
                  <button
                    onClick={addSetting}
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