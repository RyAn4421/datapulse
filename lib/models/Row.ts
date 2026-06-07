import mongoose, { Schema, Document } from 'mongoose';

export interface IRow extends Document {
  datasetId: mongoose.Types.ObjectId;
  userId: string; // Store email consistently as userId key
  data: any;
  rowIndex: number;
  createdAt: Date;
}

const RowSchema = new Schema<IRow>({
  datasetId: { type: Schema.Types.ObjectId, ref: 'Dataset', required: true },
  userId: { type: String, required: true }, // Store email consistently as userId key
  data: { type: Schema.Types.Mixed },
  rowIndex: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

RowSchema.index({ datasetId: 1, rowIndex: 1 });
RowSchema.index({ datasetId: 1, 'data.$**': 1 }); // wildcard index

export const Row = mongoose.models.Row || mongoose.model<IRow>('Row', RowSchema);
