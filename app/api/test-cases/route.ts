import { PrismaClient } from '../../generated/prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const testCases = await prisma.testCase.findMany({
      include: {
        problem: true
      }
    })
    return NextResponse.json(testCases)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get test cases' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const testCase = await prisma.testCase.create({
      data: {
        input: data.input,
        expectedOutput: data.expectedOutput,
        isSample: data.isSample,
        problemId: data.problemId
      }
    })
    
    return NextResponse.json(testCase, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create test case' }, { status: 500 })
  }
}