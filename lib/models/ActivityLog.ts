import mongoose, { Schema, Document } from 'mongoose';

export type ActivityType =
  | 'dataset_viewed'
  | 'report_generated'
  | 'chart_created'
  | 'insight_viewed'
  | 'compare_run'
  | 'share_created';

export interface IActivityLog extends Document {
  userId: string;
  type: ActivityType;
  label: string;
  datasetId?: string;
  datasetName?: string;
  meta?: Record<string, string>;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  userId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: [
      'dataset_viewed',
      'report_generated',
      'chart_created',
      'insight_viewed',
      'compare_run',
      'share_created',
    ],
    required: true,
  },
  label: { type: String, required: true },
  datasetId: { type: String },
  datasetName: { type: String },
  meta: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

ActivityLogSchema.index({ userId: 1, createdAt: -1 });

export const ActivityLog =
  mongoose.models.ActivityLog ||
  mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
