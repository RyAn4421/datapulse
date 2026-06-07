import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Workspace from '@/lib/models/Workspace'
import crypto from 'crypto'

// POST — invite a member by email
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const userId = (session.user as any)?.id ?? session.user?.email
  const { email, role } = await req.json()

  const workspace = await Workspace.findOne({ ownerId: userId })
  if (!workspace) return NextResponse.json({ error: 'No workspace found' }, { status: 404 })

  // Check if already a member
  const alreadyMember = workspace.members.some((m: any) => m.email === email)
  if (alreadyMember) return NextResponse.json({ error: 'Already a member' }, { status: 409 })

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  workspace.invites.push({ email, role, token, expiresAt })
  await workspace.save()

  // In production: send email with invite link
  // For now: return the invite link directly
  const inviteLink = `${process.env.NEXTAUTH_URL}/invite/${token}`

  return NextResponse.json({ inviteLink, token }, { status: 201 })
}
