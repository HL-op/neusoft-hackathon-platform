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

    const submissions = await prisma.submission.findMany({
      include: {
        user: { select: { name: true, email: true } },
        problem: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(submissions)
  } catch (error) {
    console.error('Error fetching submissions:', error)
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
    // 这里可以实现重新评测的逻辑
    return NextResponse.json({ message: 'Rejudge triggered' })
  } catch (error) {
    console.error('Error rejudging submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}