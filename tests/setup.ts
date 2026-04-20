// 测试环境设置
import { vi } from 'vitest'

// 模拟环境变量
process.env.NODE_ENV = 'test'
process.env.DEEPSEEK_API_KEY = 'test-api-key'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.JUDGE0_API_URL = 'http://localhost:2358'
process.env.SECRET_KEY = 'test-secret-key'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// 模拟Prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    problem: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    submission: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  })),
}))

// 模拟Next.js路由
vi.mock('next/navigation', () => ({
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    reload: vi.fn(),
  }),
  usePathname: vi.fn().mockReturnValue('/'),
  useSearchParams: vi.fn().mockReturnValue(new URLSearchParams()),
}))

// 模拟axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    create: vi.fn().mockReturnThis(),
  },
  get: vi.fn(),
  post: vi.fn(),
}))
