import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  type: 'success' | 'info' | 'warning' | 'high';
  title: string;
  message: string;
  read: boolean;
  href?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['success', 'info', 'warning', 'high'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  href: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Keep only the latest 100 per user (TTL-like via capped logic handled in API)
NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);
