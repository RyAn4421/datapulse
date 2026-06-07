import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name?: string;
  email: string;
  password?: string;
  passwordHash?: string;
  image?: string;
  role: 'admin' | 'viewer';
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String },
  passwordHash: { type: String },
  image: String,
  role: { type: String, enum: ['admin', 'viewer'], default: 'admin' },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
