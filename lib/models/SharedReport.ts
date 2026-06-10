import mongoose, { Schema, Document } from 'mongoose';

export interface ISharedReport extends Document {
  token: string;
  ownerId: string;
  datasetId: mongoose.Types.ObjectId;
  datasetName: string;
  
  executiveSummary: {
    overview: string;
    topCategory: string;
    risk: string;
    opportunities: string;
    recommendation: string;
  };
  
  metrics: {
    rowCount: number;
    colCount: number;
    totalValue: number;
    avgValue: number;
    numColName: string;
    catColName: string;
  };
  
  charts: {
    name: string;
    value: number;
  }[];
  
  generatedAt: Date;
  revokedAt?: Date;
  revokedBy?: string;
  createdAt: Date;
}

const SharedReportSchema = new Schema<ISharedReport>({
  token: { type: String, required: true, unique: true },
  ownerId: { type: String, required: true },
  datasetId: { type: Schema.Types.ObjectId, required: true, ref: 'Dataset' },
  datasetName: { type: String, required: true },
  
  executiveSummary: {
    overview: { type: String, required: true },
    topCategory: { type: String, required: true },
    risk: { type: String, required: true },
    opportunities: { type: String, required: false, default: '' },
    recommendation: { type: String, required: true },
  },
  
  metrics: {
    rowCount: { type: Number, required: true },
    colCount: { type: Number, required: true },
    totalValue: { type: Number, required: true },
    avgValue: { type: Number, required: true },
    numColName: { type: String, required: true },
    catColName: { type: String, required: true },
  },
  
  charts: [{
    name: { type: String, required: true },
    value: { type: Number, required: true },
  }],
  
  generatedAt: { type: Date, required: true },
  revokedAt: { type: Date },
  revokedBy: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const SharedReport = mongoose.models.SharedReport || mongoose.model<ISharedReport>('SharedReport', SharedReportSchema);
