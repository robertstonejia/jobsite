import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // 1時間キャッシュ

// GET - Get all skills
export async function GET() {
  try {
    const skills = await prisma.skill.findMany({
      select: {
        id: true,
        name: true,
        category: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    const response = NextResponse.json(skills)
    // スキルリストは頻繁に変更されないので1時間キャッシュ
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200')

    return response
  } catch (error) {
    console.error('Error fetching skills:', error)
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 })
  }
}

// POST - Create a new skill (admin only, but simplified for now)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, category } = body

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 })
    }

    const skill = await prisma.skill.create({
      data: {
        name,
        category,
      },
    })

    return NextResponse.json(skill, { status: 201 })
  } catch (error) {
    console.error('Error creating skill:', error)
    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 })
  }
}
