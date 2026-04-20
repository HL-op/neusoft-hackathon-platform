import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { judge0Service } from '../../lib/judge0'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    if (!data.code || !data.language || !data.problemId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 验证语言是否支持
    const supportedLanguages = ['python3', 'javascript', 'typescript', 'cpp', 'java']
    if (!supportedLanguages.includes(data.language)) {
      return NextResponse.json({ error: 'Unsupported language' }, { status: 400 })
    }

    // 提交代码到Judge0
    const submission = await judge0Service.submitCode({
      code: data.code,
      language: data.language,
      problemId: data.problemId,
      userId: session.user.id,
      timeLimit: data.timeLimit || 1000,
      memoryLimit: data.memoryLimit || 256
    })

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    console.error('Error submitting code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
