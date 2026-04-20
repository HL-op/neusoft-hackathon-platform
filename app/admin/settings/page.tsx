import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Settings {
  aiModel: string
  aiApiKey: string
  aiParams: {
    model: string
    temperature: number
    maxTokens: number
    timeout: number
    maxRetries: number
  }
  scoreRules: {
    codeQuality: number
    innovation: number
    completion: number
    presentation: number
  }
  systemParams: {
    maxSubmissionsPerDay: number
    maxFileSize: number
    judgeTimeout: number
  }
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<Settings>({
    aiModel: 'deepseek',
    aiApiKey: '',
    aiParams: {
      model: 'deepseek-coder-v1.5',
      temperature: 0.3,
      maxTokens: 2000,
      timeout: 30000,
      maxRetries: 3
    },
    scoreRules: {
      codeQuality: 20,
      innovation: 20,
      completion: 40,
      presentation: 20
    },
    systemParams: {
      maxSubmissionsPerDay: 100,
      maxFileSize: 1024,
      judgeTimeout: 5000
    }
  })

  // 加载设置
  useEffect(() => {
    // 这里可以从数据库或配置文件加载设置
    // 暂时使用默认值
  }, [])

  // 处理表单变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (name.includes('.')) {
      const [category, field] = name.split('.')
      setSettings(prev => ({
        ...prev,
        [category]: {
          ...prev[category as keyof Settings],
          [field]: type === 'number' ? parseInt(value) : value
        }
      }))
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  // 保存设置
  const saveSettings = async () => {
    try {
      // 这里实现保存设置的逻辑
      console.log('保存设置:', settings)
      alert('设置已保存')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('保存失败')
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
          <div className="space-y-6">
            <h2 className="text-xl font-bold">系统设置</h2>

            {/* AI模型设置 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-medium mb-4">AI模型设置</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">AI模型</label>
                  <select
                    name="aiModel"
                    value={settings.aiModel}
                    onChange={handleInputChange}
                    className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                  >
                    <option value="deepseek">DeepSeek</option>
                    <option value="gpt4">GPT-4</option>
                    <option value="claude">Claude</option>
                    <option value="gemini">Gemini</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">API Key</label>
                  <input
                    type="text"
                    name="aiApiKey"
                    value={settings.aiApiKey}
                    onChange={handleInputChange}
                    className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                    placeholder="输入API Key"
                  />
                </div>
                
                <div className="pt-4 border-t border-gray-700">
                  <h4 className="text-md font-medium mb-3">模型参数设置</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">模型名称</label>
                      <input
                        type="text"
                        name="aiParams.model"
                        value={settings.aiParams.model}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                        placeholder="模型名称"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">温度参数 (0-1)</label>
                      <input
                        type="number"
                        name="aiParams.temperature"
                        value={settings.aiParams.temperature}
                        onChange={handleInputChange}
                        min="0"
                        max="1"
                        step="0.1"
                        className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">最大token数</label>
                      <input
                        type="number"
                        name="aiParams.maxTokens"
                        value={settings.aiParams.maxTokens}
                        onChange={handleInputChange}
                        min="100"
                        max="4000"
                        className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">超时时间 (ms)</label>
                      <input
                        type="number"
                        name="aiParams.timeout"
                        value={settings.aiParams.timeout}
                        onChange={handleInputChange}
                        min="5000"
                        max="60000"
                        className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">最大重试次数</label>
                      <input
                        type="number"
                        name="aiParams.maxRetries"
                        value={settings.aiParams.maxRetries}
                        onChange={handleInputChange}
                        min="1"
                        max="5"
                        className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 得分规则设置 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-medium mb-4">得分规则设置</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">代码质量 (0-100)</label>
                  <input
                    type="number"
                    name="scoreRules.codeQuality"
                    value={settings.scoreRules.codeQuality}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">创新性 (0-100)</label>
                  <input
                    type="number"
                    name="scoreRules.innovation"
                    value={settings.scoreRules.innovation}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">完成度 (0-100)</label>
                  <input
                    type="number"
                    name="scoreRules.completion"
                    value={settings.scoreRules.completion}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">演示效果 (0-100)</label>
                  <input
                    type="number"
                    name="scoreRules.presentation"
                    value={settings.scoreRules.presentation}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                  />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-400">
                总分: {settings.scoreRules.codeQuality + settings.scoreRules.innovation + settings.scoreRules.completion + settings.scoreRules.presentation}
              </div>
            </div>

            {/* 系统参数设置 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-medium mb-4">系统参数设置</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">每日最大提交次数</label>
                  <input
                    type="number"
                    name="systemParams.maxSubmissionsPerDay"
                    value={settings.systemParams.maxSubmissionsPerDay}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">最大文件大小 (KB)</label>
                  <input
                    type="number"
                    name="systemParams.maxFileSize"
                    value={settings.systemParams.maxFileSize}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">评测超时时间 (ms)</label>
                  <input
                    type="number"
                    name="systemParams.judgeTimeout"
                    value={settings.systemParams.judgeTimeout}
                    onChange={handleInputChange}
                    min="1000"
                    className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* 保存按钮 */}
            <div className="flex justify-end">
              <button
                onClick={saveSettings}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
              >
                保存设置
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
