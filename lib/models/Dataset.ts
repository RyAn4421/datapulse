import mongoose, { Schema, Document } from 'mongoose';

export interface IExecutiveSummary {
  overview: string;
  topCategory: string;
  risk: string;
  recommendation: string;
}

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
  // Sprint 1B — AI Summary Cache
  aiSummary?: IExecutiveSummary;
  summaryHash?: string;          // SHA-256 of headers + first 100 rows + rowCount
  summaryGeneratedAt?: Date;
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
  // Sprint 1B — AI Summary Cache
  aiSummary: {
    overview:       { type: String },
    topCategory:    { type: String },
    risk:           { type: String },
    recommendation: { type: String },
  },
  summaryHash:        { type: String },
  summaryGeneratedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Dataset = mongoose.models.Dataset || mongoose.model<IDataset>('Dataset', DatasetSchema);
