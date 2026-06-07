import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'

// Simple Annotation schema
const AnnotationSchema = new mongoose.Schema({
  userId: String,
  datasetId: String,
  chartKey: String,   // e.g. "distribution-chart" or "kpi-total-revenue"
  note: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const Annotation = mongoose.models.Annotation || mongoose.model('Annotation', AnnotationSchema)

// GET /api/annotations?datasetId=xxx
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const datasetId = req.nextUrl.searchParams.get('datasetId')
  const userId = (session.user as any)?.id ?? session.user?.email

  const annotations = await Annotation.find({ userId, datasetId }).sort({ createdAt: -1 })
  return NextResponse.json({ annotations })
}

// POST /api/annotations
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { datasetId, chartKey, note } = await req.json()
  const userId = (session.user as any)?.id ?? session.user?.email

  // Upsert — one note per chart per dataset per user
  const annotation = await Annotation.findOneAndUpdate(
    { userId, datasetId, chartKey },
    { note, updatedAt: new Date() },
    { upsert: true, new: true }
  )
  return NextResponse.json({ annotation }, { status: 201 })
}

// DELETE /api/annotations?datasetId=xxx&chartKey=xxx
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const datasetId = req.nextUrl.searchParams.get('datasetId')
  const chartKey = req.nextUrl.searchParams.get('chartKey')
  const userId = (session.user as any)?.id ?? session.user?.email

  await Annotation.deleteOne({ userId, datasetId, chartKey })
  return NextResponse.json({ success: true })
}
