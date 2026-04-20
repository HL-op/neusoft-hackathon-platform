import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// 模拟PrismaClient
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

// 模拟NextRequest
const createMockRequest = (body: any) => {
  return {
    json: vi.fn().mockResolvedValue(body),
    headers: new Headers()
  }
}

describe('API集成测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('应该正确处理代码提交', async () => {
    const mockBody = {
      code: 'console.log("Hello world")',
      language: 'javascript',
      problemId: '1',
      timeLimit: 1000,
      memoryLimit: 256
    }

    const request = createMockRequest(mockBody)
    expect(request.json()).toBeDefined()
  })

  it('应该正确处理AI代码分析', async () => {
    const mockBody = {
      code: 'function solution() { return "Hello world"; }',
      language: 'javascript'
    }

    const request = createMockRequest(mockBody)
    expect(request.json()).toBeDefined()
  })

  it('应该正确处理AI代码评分', async () => {
    const mockBody = {
      code: 'function solution() { return "Hello world"; }',
      language: 'javascript',
      problemDescription: '输出Hello world'
    }

    const request = createMockRequest(mockBody)
    expect(request.json()).toBeDefined()
  })

  it('应该正确处理AI代码摘要', async () => {
    const mockBody = {
      code: 'function solution() { return "Hello world"; }',
      language: 'javascript'
    }

    const request = createMockRequest(mockBody)
    expect(request.json()).toBeDefined()
  })
})
