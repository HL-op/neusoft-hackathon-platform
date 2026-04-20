import { PrismaClient } from '../../generated/prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const competitions = await prisma.competition.findMany({
      include: {
        problems: true,
        teams: true
      }
    })
    return NextResponse.json(competitions)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get competitions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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
    return NextResponse.json({ error: 'Failed to create competition' }, { status: 500 })
  }
}