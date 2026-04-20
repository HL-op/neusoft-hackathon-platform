import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '../../generated/prisma/client'
import { getServerSession } from 'next-auth'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const problems = await prisma.problem.findMany({
      include: {
        competition: { select: { name: true } },
        testCases: { select: { id: true, isSample: true } }
      }
    })
    return NextResponse.json(problems)
  } catch (error) {
    console.error('Error fetching problems:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // 创建测试用例
    if (data.testCases) {
      for (const testCase of data.testCases) {
        await prisma.testCase.create({
          data: {
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            isSample: testCase.isSample,
            problemId: problem.id
          }
        })
      }
    }

    return NextResponse.json(problem, { status: 201 })
  } catch (error) {
    console.error('Error creating problem:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const problem = await prisma.problem.update({
      where: { id: data.id },
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

    // 更新测试用例
    if (data.testCases) {
      // 删除旧测试用例
      await prisma.testCase.deleteMany({ where: { problemId: data.id } })
      // 创建新测试用例
      for (const testCase of data.testCases) {
        await prisma.testCase.create({
          data: {
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            isSample: testCase.isSample,
            problemId: data.id
          }
        })
      }
    }

    return NextResponse.json(problem)
  } catch (error) {
    console.error('Error updating problem:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()
    await prisma.problem.delete({ where: { id } })
    return NextResponse.json({ message: 'Problem deleted successfully' })
  } catch (error) {
    console.error('Error deleting problem:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}