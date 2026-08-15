import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationData {
  loanId?: mongoose.Types.ObjectId;
  oldStatus?: string;
  newStatus?: string;
  creditScore?: number;
  riskCategory?: string;
}

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'status_change' | 'score_ready' | 'score_failed' | 'assignment' | 'system';
  title: string;
  message: string;
  data?: INotificationData;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['status_change', 'score_ready', 'score_failed', 'assignment', 'system'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      loanId: { type: Schema.Types.ObjectId, ref: 'LoanApplication' },
      oldStatus: { type: String },
      newStatus: { type: String },
      creditScore: { type: Number },
      riskCategory: { type: String },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model<INotification>('Notification', notificationSchema);
