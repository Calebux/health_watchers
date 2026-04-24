import mongoose, { Schema, Document } from 'mongoose';

export interface IImportLog extends Document {
  clinicId: mongoose.Types.ObjectId;
  importedBy: mongoose.Types.ObjectId;
  filename: string;
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: Array<{ row: number; field?: string; error: string }>;
  status: 'processing' | 'completed' | 'failed' | 'aborted';
  createdAt: Date;
  completedAt?: Date;
}

const ImportLogSchema = new Schema<IImportLog>({
  clinicId: { type: Schema.Types.ObjectId, ref: 'Clinic', required: true, index: true },
  importedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  totalRows: { type: Number, default: 0 },
  importedCount: { type: Number, default: 0 },
  skippedCount: { type: Number, default: 0 },
  errorCount: { type: Number, default: 0 },
  errors: [
    {
      row: Number,
      field: String,
      error: String,
    },
  ],
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed', 'aborted'],
    default: 'processing',
  },
  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
});

export const ImportLogModel = mongoose.model<IImportLog>('ImportLog', ImportLogSchema);
