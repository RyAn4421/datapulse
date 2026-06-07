import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Workspace from '@/lib/models/Workspace'

// DELETE — remove a member
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const userId = (session.user as any)?.id ?? session.user?.email
  const { memberId } = await req.json()

  const workspace = await Workspace.findOne({ ownerId: userId })
  if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 404 })

  workspace.members = workspace.members.filter((m: any) => m.userId !== memberId && m.email !== memberId)
  await workspace.save()

  return NextResponse.json({ success: true })
}

// PATCH — change a member's role
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const userId = (session.user as any)?.id ?? session.user?.email
  const { memberId, role } = await req.json()

  const workspace = await Workspace.findOne({ ownerId: userId })
  if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 404 })

  const member = workspace.members.find((m: any) => m.userId === memberId || m.email === memberId)
  if (member) member.role = role
  await workspace.save()

  return NextResponse.json({ success: true })
}
