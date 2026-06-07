import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Workspace from '@/lib/models/Workspace'

// GET — get the user's workspace (or null if none)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const userId = (session.user as any)?.id ?? session.user?.email

  // User is either owner or member
  const workspace = await Workspace.findOne({
    $or: [
      { ownerId: userId },
      { 'members.userId': userId },
    ]
  })

  return NextResponse.json({ workspace })
}

// POST — create a workspace
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const userId = (session.user as any)?.id ?? session.user?.email
  const { name } = await req.json()

  // Check if user already owns a workspace
  const existing = await Workspace.findOne({ ownerId: userId })
  if (existing) return NextResponse.json({ error: 'You already have a workspace' }, { status: 409 })

  const workspace = await Workspace.create({
    name,
    ownerId: userId,
    members: [{
      userId,
      email: session.user?.email,
      name: session.user?.name,
      role: 'owner',
    }],
  })

  return NextResponse.json({ workspace }, { status: 201 })
}
