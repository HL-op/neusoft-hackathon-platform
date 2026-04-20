import { PrismaClient } from '../../generated/prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const judgeScores = await prisma.judgeScore.findMany({
      include: {
        submission: true,
        judge: true
      }
    })
    return NextResponse.json(judgeScores)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get judge scores' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const judgeScore = await prisma.judgeScore.create({
      data: {
        codeQuality: data.codeQuality,
        innovation: data.innovation,
        completion: data.completion,
        comment: data.comment,
        submissionId: data.submissionId,
        judgeId: data.judgeId
      }
    })
    
    return NextResponse.json(judgeScore, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create judge score' }, { status: 500 })
  }
}