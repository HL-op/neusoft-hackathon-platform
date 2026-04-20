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

    const competitions = await prisma.competition.findMany()
    return NextResponse.json(competitions)
  } catch (error) {
    console.error('Error fetching competitions:', error)
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
    const competition = await prisma.competition.create({
      data: {
        name: data.name,
        description: data.description,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        isActive: data.isActive
      }
    })
    return NextResponse.json(competition, { status: 201 })
  } catch (error) {
    console.error('Error creating competition:', error)
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
    const competition = await prisma.competition.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        isActive: data.isActive
      }
    })
    return NextResponse.json(competition)
  } catch (error) {
    console.error('Error updating competition:', error)
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
    await prisma.competition.delete({ where: { id } })
    return NextResponse.json({ message: 'Competition deleted successfully' })
  } catch (error) {
    console.error('Error deleting competition:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}