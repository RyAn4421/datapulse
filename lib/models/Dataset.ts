import mongoose, { Schema, Document } from 'mongoose';

export interface IDataset extends Document {
  userId: string; // Stored consistently as session.user.email
  name: string;
  description?: string;
  fileName: string;
  fileType: string;
  source?: string;
  headers: string[];
  rowCount: number;
  numericCols: string[];
  categoricalCols: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DatasetSchema = new Schema<IDataset>({
  userId: { type: String, required: true }, // Store email consistently as userId key
  name: { type: String, required: true },
  description: String,
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  source: { type: String, default: 'csv' },
  headers: [String],
  rowCount: { type: Number, default: 0 },
  numericCols: [String],
  categoricalCols: [String],
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Dataset = mongoose.models.Dataset || mongoose.model<IDataset>('Dataset', DatasetSchema);
