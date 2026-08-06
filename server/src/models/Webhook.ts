import mongoose, { Schema, Document } from 'mongoose';

export interface IWebhook extends Document {
  userId: mongoose.Types.ObjectId;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  failureCount: number;
  lastDeliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const webhookSchema = new Schema<IWebhook>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    secret: {
      type: String,
      required: true,
    },
    events: {
      type: [String],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
    lastDeliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

webhookSchema.index({ userId: 1 });
webhookSchema.index({ events: 1, isActive: 1 });

export default mongoose.model<IWebhook>('Webhook', webhookSchema);
