import mongoose from 'mongoose'

export interface IWorkspace {
  _id: string
  name: string
  ownerId: string
  members: {
    userId: string
    email: string
    name: string
    role: 'owner' | 'analyst' | 'viewer'
    joinedAt: Date
  }[]
  invites: {
    email: string
    role: 'analyst' | 'viewer'
    token: string
    expiresAt: Date
  }[]
  createdAt: Date
}

const WorkspaceSchema = new mongoose.Schema<IWorkspace>({
  name: { type: String, required: true },
  ownerId: { type: String, required: true },
  members: [{
    userId: String,
    email: String,
    name: String,
    role: { type: String, enum: ['owner', 'analyst', 'viewer'], default: 'viewer' },
    joinedAt: { type: Date, default: Date.now },
  }],
  invites: [{
    email: String,
    role: { type: String, enum: ['analyst', 'viewer'] },
    token: String,
    expiresAt: Date,
  }],
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.Workspace || mongoose.model<IWorkspace>('Workspace', WorkspaceSchema)
