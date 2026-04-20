import { PrismaClient } from '../../generated/prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        teamMembers: {
          include: {
            user: true
          }
        },
        competition: true
      }
    })
    return NextResponse.json(teams)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get teams' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const team = await prisma.team.create({
      data: {
        name: data.name,
        competitionId: data.competitionId
      }
    })
    
    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
  }
}