import { PrismaClient } from '../../generated/prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const problems = await prisma.problem.findMany({
      include: {
        testCases: true,
        competition: true
      }
    })
    return NextResponse.json(problems)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get problems' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const problem = await prisma.problem.create({
      data: {
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        score: data.score,
        timeLimit: data.timeLimit,
        memoryLimit: data.memoryLimit,
        competitionId: data.competitionId
      }
    })
    
    return NextResponse.json(problem, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create problem' }, { status: 500 })
  }
}