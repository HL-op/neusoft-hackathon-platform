import { PrismaClient } from '../../generated/prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const submissions = await prisma.submission.findMany({
      include: {
        user: true,
        problem: true,
        competition: true,
        judgeScores: true
      }
    })
    return NextResponse.json(submissions)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get submissions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const submission = await prisma.submission.create({
      data: {
        code: data.code,
        language: data.language,
        status: 'PENDING',
        userId: data.userId,
        problemId: data.problemId,
        competitionId: data.competitionId
      }
    })
    
    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 })
  }
}