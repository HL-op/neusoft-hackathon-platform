import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

// 导航菜单项
const menuItems = [
  {
    title: '仪表盘',
    href: '/admin/dashboard',
    icon: '📊'
  },
  {
    title: '比赛管理',
    href: '/admin/competitions',
    icon: '🏆'
  },
  {
    title: '题目管理',
    href: '/admin/problems',
    icon: '📝'
  },
  {
    title: '选手管理',
    href: '/admin/participants',
    icon: '👥'
  },
  {
    title: '评委管理',
    href: '/admin/judges',
    icon: '⚖️'
  },
  {
    title: '提交管理',
    href: '/admin/submissions',
    icon: '📤'
  },
  {
    title: '评分管理',
    href: '/admin/scores',
    icon: '⭐'
  },
  {
    title: '统计报表',
    href: '/admin/reports',
    icon: '📈'
  },
  {
    title: '系统设置',
    href: '/admin/settings',
    icon: '⚙️'
  }
]

export default function AdminPage() {
  const { data: session } = useSession()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">请先登录</h1>
          <Link href="/auth/login" className="text-blue-400 hover:underline">前往登录</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 顶部导航栏 */}
      <header className="bg-gray-800 border-b border-gray-700 py-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-white p-2 rounded-lg hover:bg-gray-700"
            >
              {isSidebarOpen ? '📐' : '📏'}
            </button>
            <h1 className="text-2xl font-bold text-blue-400">
              组委会管理后台
            </h1>
          </div>
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
        <aside 
          className={`bg-gray-800 border-r border-gray-700 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}
        >
          <nav className="p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-colors group"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className={`${isSidebarOpen ? 'block' : 'hidden'} group-hover:block transition-all`}>
                      {item.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 p-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-blue-300">欢迎来到管理后台</h2>
            <p className="text-gray-400 mb-6">
              这里是广东东软学院AI黑客马拉松的管理后台，您可以在这里管理比赛的全流程。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="text-3xl font-bold text-blue-400 mb-2">🏆</div>
                <h3 className="text-lg font-semibold mb-1">比赛管理</h3>
                <p className="text-gray-400 text-sm">创建和管理比赛</p>
                <Link 
                  href="/admin/competitions" 
                  className="mt-3 inline-block text-blue-400 hover:underline"
                >
                  进入管理 →
                </Link>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="text-3xl font-bold text-green-400 mb-2">📝</div>
                <h3 className="text-lg font-semibold mb-1">题目管理</h3>
                <p className="text-gray-400 text-sm">创建和管理题目</p>
                <Link 
                  href="/admin/problems" 
                  className="mt-3 inline-block text-green-400 hover:underline"
                >
                  进入管理 →
                </Link>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="text-3xl font-bold text-yellow-400 mb-2">👥</div>
                <h3 className="text-lg font-semibold mb-1">选手管理</h3>
                <p className="text-gray-400 text-sm">管理参赛选手</p>
                <Link 
                  href="/admin/participants" 
                  className="mt-3 inline-block text-yellow-400 hover:underline"
                >
                  进入管理 →
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}