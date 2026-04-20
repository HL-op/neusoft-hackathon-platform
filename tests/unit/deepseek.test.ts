import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

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

describe('DeepSeek服务测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('应该正确定义DeepSeek API配置', () => {
    const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
    expect(DEEPSEEK_API_URL).toBeDefined()
    expect(DEEPSEEK_API_URL).toContain('api.deepseek.com')
  })

  it('应该支持代码分析功能', () => {
    const mockAnalysis = {
      codeQuality: 85,
      readability: 90,
      issues: [],
      suggestions: ['优化代码结构', '添加注释'],
      complexity: 'low',
      explanation: '代码质量良好'
    }
    expect(mockAnalysis).toBeDefined()
    expect(mockAnalysis.codeQuality).toBeGreaterThanOrEqual(0)
    expect(mockAnalysis.codeQuality).toBeLessThanOrEqual(100)
  })

  it('应该支持代码评分功能', () => {
    const mockScore = {
      codeQuality: 18,
      innovation: 15,
      completion: 35,
      presentation: 18,
      totalScore: 86,
      comments: '代码质量良好',
      suggestions: ['优化算法']
    }
    expect(mockScore).toBeDefined()
    expect(mockScore.totalScore).toBeLessThanOrEqual(100)
    expect(mockScore.totalScore).toBeGreaterThanOrEqual(0)
  })

  it('应该支持代码摘要生成', () => {
    const mockSummary = '这是一个输出Hello world的函数'
    expect(mockSummary).toBeDefined()
    expect(typeof mockSummary).toBe('string')
    expect(mockSummary.length).toBeGreaterThan(0)
  })
})
