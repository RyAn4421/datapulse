import mongoose, { Schema, Document } from 'mongoose';

export interface IComparisonSummary {
  keyDifferences: string;
  qualityAssessment: string;
  riskAnalysis: string;
  recommendation: string;
}

export interface IComparison extends Document {
  hashKey: string;
  summary: IComparisonSummary;
  datasetAId: mongoose.Types.ObjectId;
  datasetBId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ComparisonSchema = new Schema<IComparison>({
  hashKey: { type: String, required: true, unique: true },
  summary: {
    keyDifferences: { type: String, required: true },
    qualityAssessment: { type: String, required: true },
    riskAnalysis: { type: String, required: true },
    recommendation: { type: String, required: true },
  },
  datasetAId: { type: Schema.Types.ObjectId, ref: 'Dataset', required: true },
  datasetBId: { type: Schema.Types.ObjectId, ref: 'Dataset', required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Comparison = mongoose.models.Comparison || mongoose.model<IComparison>('Comparison', ComparisonSchema);
