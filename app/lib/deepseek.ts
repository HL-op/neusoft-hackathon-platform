import axios from 'axios'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

class DeepSeekService {
  private apiKey: string
  private model: string
  private maxRetries: number = 3

  constructor(apiKey: string, model: string = 'deepseek-coder-v1.5') {
    this.apiKey = apiKey
    this.model = model
  }

  // 通用请求方法，包含重试机制
  private async request(messages: any[], maxTokens: number = 1000): Promise<any> {
    let retries = 0
    while (retries < this.maxRetries) {
      try {
        const response = await axios.post(
          DEEPSEEK_API_URL,
          {
            model: this.model,
            messages,
            max_tokens: maxTokens,
            temperature: 0.3
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`
            }
          }
        )
        return response.data.choices[0].message.content
      } catch (error) {
        retries++
        if (retries >= this.maxRetries) {
          throw error
        }
        // 指数退避
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)))
      }
    }
  }

  // 分析代码质量
  async analyzeCode(code: string, language: string): Promise<any> {
    const messages = [
      {
        role: 'system',
        content: `你是一个专业的代码分析工具，需要对以下${language}代码进行全面分析，包括：\n1. 代码质量评估\n2. 可读性分析\n3. 潜在问题识别\n4. 优化建议\n5. 代码复杂度分析\n\n请以JSON格式返回结果，包含以下字段：\n- codeQuality: 0-100的评分\n- readability: 0-100的评分\n- issues: 问题数组，每个问题包含description和severity（low/medium/high）\n- suggestions: 优化建议数组\n- complexity: 复杂度分析（low/medium/high）\n- explanation: 详细分析说明`
      },
      {
        role: 'user',
        content: `分析以下${language}代码：\n\n${code}`
      }
    ]

    const result = await this.request(messages, 2000)
    return JSON.parse(result)
  }

  // 为代码评分
  async scoreCode(code: string, language: string, problemDescription: string): Promise<any> {
    const messages = [
      {
        role: 'system',
        content: `你是一个专业的代码评审专家，需要根据以下标准对代码进行评分：\n1. 代码质量（0-20分）：代码的正确性、健壮性、可读性\n2. 创新性（0-20分）：解决方案的创新程度\n3. 完成度（0-40分）：是否完整解决了问题\n4. 演示效果（0-20分）：代码的可展示性和用户体验\n\n请以JSON格式返回结果，包含以下字段：\n- codeQuality: 0-20的评分\n- innovation: 0-20的评分\n- completion: 0-40的评分\n- presentation: 0-20的评分\n- totalScore: 总分\n- comments: 详细评语\n- suggestions: 改进建议`
      },
      {
        role: 'user',
        content: `根据以下问题描述，对${language}代码进行评分：\n\n问题描述：${problemDescription}\n\n代码：\n${code}`
      }
    ]

    const result = await this.request(messages, 2000)
    return JSON.parse(result)
  }

  // 生成代码摘要
  async generateCodeSummary(code: string, language: string): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: `你是一个专业的代码分析工具，需要为以下${language}代码生成简洁的功能摘要，包括：\n1. 代码的主要功能\n2. 核心算法或逻辑\n3. 输入输出描述\n4. 关键技术点\n\n请用中文返回一个不超过200字的摘要。`
      },
      {
        role: 'user',
        content: `为以下${language}代码生成功能摘要：\n\n${code}`
      }
    ]

    return await this.request(messages, 500)
  }

  // 生成代码改进建议
  async generateImprovementSuggestions(code: string, language: string): Promise<string[]> {
    const messages = [
      {
        role: 'system',
        content: `你是一个专业的代码优化专家，需要为以下${language}代码提供具体的改进建议，包括：\n1. 性能优化\n2. 代码风格\n3. 安全性\n4. 可维护性\n\n请以JSON格式返回一个建议数组。`
      },
      {
        role: 'user',
        content: `为以下${language}代码提供改进建议：\n\n${code}`
      }
    ]

    const result = await this.request(messages, 1000)
    return JSON.parse(result)
  }
}

// 导出单例实例
export const deepseekService = new DeepSeekService(
  process.env.DEEPSEEK_API_KEY || ''
)
export { DeepSeekService }
