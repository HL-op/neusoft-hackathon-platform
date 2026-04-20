import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { deepseekService } from '../../../lib/deepseek'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    if (!data.code || !data.language) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 检查API密钥是否配置
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'DeepSeek API key not configured' }, { status: 500 })
    }

    // 生成代码摘要
    const summary = await deepseekService.generateCodeSummary(data.code, data.language)

    return NextResponse.json({ summary }, { status: 200 })
  } catch (error) {
    console.error('Error generating code summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
