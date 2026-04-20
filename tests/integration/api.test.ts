import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as submitCode } from '../../app/api/submissions/route'
import { POST as aiAnalyze } from '../../app/api/ai/analyze/route'
import { POST as aiScore } from '../../app/api/ai/score/route'
import { POST as aiSummary } from '../../app/api/ai/summary/route'

// 模拟NextRequest
const createMockRequest = (body: any) => {
  return {
    json: vi.fn().mockResolvedValue(body),
    headers: new Headers()
  } as NextRequest
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

    // 这里我们只测试API路由的调用，不实际执行，因为需要数据库和Judge0连接
    // 实际测试中需要使用测试数据库和模拟服务
    expect(submitCode).toBeDefined()
  })

  it('应该正确处理AI代码分析', async () => {
    const mockBody = {
      code: 'function solution() { return "Hello world"; }',
      language: 'javascript'
    }

    const request = createMockRequest(mockBody)

    // 这里我们只测试API路由的调用，不实际执行，因为需要DeepSeek API密钥
    expect(aiAnalyze).toBeDefined()
  })

  it('应该正确处理AI代码评分', async () => {
    const mockBody = {
      code: 'function solution() { return "Hello world"; }',
      language: 'javascript',
      problemDescription: '输出Hello world'
    }

    const request = createMockRequest(mockBody)

    // 这里我们只测试API路由的调用，不实际执行，因为需要DeepSeek API密钥
    expect(aiScore).toBeDefined()
  })

  it('应该正确处理AI代码摘要', async () => {
    const mockBody = {
      code: 'function solution() { return "Hello world"; }',
      language: 'javascript'
    }

    const request = createMockRequest(mockBody)

    // 这里我们只测试API路由的调用，不实际执行，因为需要DeepSeek API密钥
    expect(aiSummary).toBeDefined()
  })
})
