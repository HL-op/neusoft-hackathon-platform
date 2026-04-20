import axios from 'axios'
import { PrismaClient } from '../generated/prisma/client'

const prisma = new PrismaClient()
const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'http://localhost:2358'

// 编程语言映射
const LANGUAGE_IDS = {
  'python3': 71, // Python 3.10
  'javascript': 63, // JavaScript
  'typescript': 94, // TypeScript
  'cpp': 54, // C++
  'java': 62 // Java
}

class Judge0Service {
  private submissionQueue: Array<{
    id: string
    code: string
    language: string
    problemId: string
    userId: string
  }> = []
  private isProcessing = false

  // 提交代码到Judge0
  async submitCode(submissionData: {
    code: string
    language: string
    problemId: string
    userId: string
    timeLimit: number
    memoryLimit: number
  }) {
    try {
      // 创建本地提交记录
      const submission = await prisma.submission.create({
        data: {
          code: submissionData.code,
          language: submissionData.language,
          status: 'PENDING',
          problemId: submissionData.problemId,
          userId: submissionData.userId
        }
      })

      // 添加到队列
      this.submissionQueue.push({
        id: submission.id,
        code: submissionData.code,
        language: submissionData.language,
        problemId: submissionData.problemId,
        userId: submissionData.userId
      })

      // 处理队列
      this.processQueue()

      return submission
    } catch (error) {
      console.error('Error submitting code:', error)
      throw error
    }
  }

  // 处理提交队列
  private async processQueue() {
    if (this.isProcessing || this.submissionQueue.length === 0) {
      return
    }

    this.isProcessing = true

    while (this.submissionQueue.length > 0) {
      const item = this.submissionQueue.shift()
      if (item) {
        await this.processSubmission(item)
      }
    }

    this.isProcessing = false
  }

  // 处理单个提交
  private async processSubmission(item: {
    id: string
    code: string
    language: string
    problemId: string
    userId: string
  }) {
    try {
      // 获取题目信息
      const problem = await prisma.problem.findUnique({
        where: { id: item.problemId }
      })

      if (!problem) {
        throw new Error('Problem not found')
      }

      // 获取测试用例
      const testCases = await prisma.testCase.findMany({
        where: { problemId: item.problemId }
      })

      if (testCases.length === 0) {
        throw new Error('No test cases found')
      }

      // 准备Judge0请求
      const languageId = LANGUAGE_IDS[item.language as keyof typeof LANGUAGE_IDS]
      if (!languageId) {
        throw new Error('Unsupported language')
      }

      // 提交到Judge0
      const response = await axios.post(`${JUDGE0_API_URL}/submissions`, {
        source_code: item.code,
        language_id: languageId,
        stdin: testCases[0].input,
        expected_output: testCases[0].expectedOutput,
        time_limit: problem.timeLimit / 1000, // 转换为秒
        memory_limit: problem.memoryLimit
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // 更新提交状态
      await prisma.submission.update({
        where: { id: item.id },
        data: {
          status: 'RUNNING'
        }
      })

      // 轮询获取结果
      await this.pollSubmissionResult(item.id, response.data.token)
    } catch (error) {
      console.error('Error processing submission:', error)
      // 更新为错误状态
      await prisma.submission.update({
        where: { id: item.id },
        data: {
          status: 'WRONG_ANSWER'
        }
      })
    }
  }

  // 轮询获取评测结果
  private async pollSubmissionResult(submissionId: string, token: string) {
    let attempts = 0
    const maxAttempts = 30
    const interval = 1000

    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(`${JUDGE0_API_URL}/submissions/${token}`, {
          params: {
            base64_encoded: false
          }
        })

        const result = response.data

        if (result.status.id !== 1 && result.status.id !== 2) {
          // 评测完成
          let status = 'WRONG_ANSWER'
          let score = 0

          if (result.status.id === 3) { // Accepted
            status = 'ACCEPTED'
            score = 100
          } else if (result.status.id === 4) { // Wrong Answer
            status = 'WRONG_ANSWER'
          } else if (result.status.id === 5) { // Time Limit Exceeded
            status = 'TIME_LIMIT_EXCEEDED'
          } else if (result.status.id === 6) { // Memory Limit Exceeded
            status = 'MEMORY_LIMIT_EXCEEDED'
          }

          // 更新提交记录
          await prisma.submission.update({
            where: { id: submissionId },
            data: {
              status,
              score,
              runtime: result.time ? parseFloat(result.time) * 1000 : null, // 转换为毫秒
              memory: result.memory ? parseInt(result.memory) : null
            }
          })

          break
        }

        attempts++
        await new Promise(resolve => setTimeout(resolve, interval))
      } catch (error) {
        console.error('Error polling submission result:', error)
        break
      }
    }

    if (attempts >= maxAttempts) {
      // 超时
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: 'TIME_LIMIT_EXCEEDED'
        }
      })
    }
  }

  // 重新评测
  async rejudgeSubmission(submissionId: string) {
    try {
      const submission = await prisma.submission.findUnique({
        where: { id: submissionId }
      })

      if (!submission) {
        throw new Error('Submission not found')
      }

      // 重置状态
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: 'PENDING',
          score: null,
          runtime: null,
          memory: null
        }
      })

      // 添加到队列
      this.submissionQueue.push({
        id: submission.id,
        code: submission.code,
        language: submission.language,
        problemId: submission.problemId,
        userId: submission.userId
      })

      // 处理队列
      this.processQueue()

      return submission
    } catch (error) {
      console.error('Error rejudging submission:', error)
      throw error
    }
  }
}

export const judge0Service = new Judge0Service()
export { LANGUAGE_IDS }
