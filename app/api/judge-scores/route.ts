import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '../../generated/prisma/client'
import { getServerSession } from 'next-auth'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'JUDGE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const scores = await prisma.judgeScore.findMany({
      include: {
        submission: {
          include: {
            user: { select: { name: true, email: true } },
            problem: { select: { title: true } }
          }
        },
        judge: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(scores)
  } catch (error) {
    console.error('Error fetching judge scores:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'JUDGE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const score = await prisma.judgeScore.create({
      data: {
        codeQuality: data.codeQuality,
        innovation: data.innovation,
        completion: data.completion,
        comment: data.comment,
        submissionId: data.submissionId,
        judgeId: session.user.id
      }
    })
    return NextResponse.json(score, { status: 201 })
  } catch (error) {
    console.error('Error creating judge score:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'JUDGE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const score = await prisma.judgeScore.update({
      where: { id: data.id },
      data: {
        codeQuality: data.codeQuality,
        innovation: data.innovation,
        completion: data.completion,
        comment: data.comment
      }
    })
    return NextResponse.json(score)
  } catch (error) {
    console.error('Error updating judge score:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}