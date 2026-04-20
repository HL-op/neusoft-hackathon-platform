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
    
    if (!data.submissionId) {
      return NextResponse.json({ error: 'Missing submissionId' }, { status: 400 })
    }

    // 重新评测
    const submission = await judge0Service.rejudgeSubmission(data.submissionId)

    return NextResponse.json(submission)
  } catch (error) {
    console.error('Error rejudging submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
