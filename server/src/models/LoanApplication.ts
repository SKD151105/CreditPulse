import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentSubdoc {
  _id: mongoose.Types.ObjectId;
  type: 'aadhaar' | 'pan' | 'income_proof' | 'bank_statement' | 'address_proof' | 'other';
  s3Key: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export interface IScoreMetric {
  score: number;
  weight: number;
  details: string;
}

export interface IScoringBreakdown {
  incomeToLoanRatio?: IScoreMetric;
  employmentStability?: IScoreMetric;
  loanToIncomeRatio?: IScoreMetric;
  documentCompleteness?: IScoreMetric;
  loanTypeRisk?: IScoreMetric;
}

export interface IEmiDetails {
  monthlyEmi: number;
  totalInterest: number;
  totalPayment: number;
  interestRate: number;
}

export interface IStatusHistorySubdoc {
  from: string;
  to: string;
  changedBy: mongoose.Types.ObjectId;
  remarks?: string;
  timestamp: Date;
}

export interface ILoanApplication extends Document {
  applicantId: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  panNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  loanType: 'personal' | 'business' | 'education' | 'home';
  amount: number;
  tenure: number;
  purpose: string;
  interestRate?: number;
  employmentType: 'salaried' | 'self-employed' | 'student';
  monthlyIncome: number;
  employerName?: string;
  documents: IDocumentSubdoc[];
  fileUrl?: string;
  fileUrls?: string[];
  creditScore?: number;
  riskCategory?: 'low' | 'medium' | 'high' | 'very_high';
  scoringBreakdown?: IScoringBreakdown;
  scoredAt?: Date;
  emiDetails?: IEmiDetails;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'disbursed';
  statusHistory: IStatusHistorySubdoc[];
  assignedTo?: mongoose.Types.ObjectId;
  reviewRemarks?: string;
  approvedAmount?: number;
  rejectionReason?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const documentSubSchema = new Schema<IDocumentSubdoc>(
  {
    type: {
      type: String,
      enum: ['aadhaar', 'pan', 'income_proof', 'bank_statement', 'address_proof', 'other'],
      required: true,
    },
    s3Key: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  }
);

const scoreMetricSchema = new Schema<IScoreMetric>(
  {
    score: { type: Number, required: true },
    weight: { type: Number, required: true },
    details: { type: String, required: true },
  },
  { _id: false }
);

const scoringBreakdownSchema = new Schema<IScoringBreakdown>(
  {
    incomeToLoanRatio: { type: scoreMetricSchema },
    employmentStability: { type: scoreMetricSchema },
    loanToIncomeRatio: { type: scoreMetricSchema },
    documentCompleteness: { type: scoreMetricSchema },
    loanTypeRisk: { type: scoreMetricSchema },
  },
  { _id: false }
);

const emiDetailsSchema = new Schema<IEmiDetails>(
  {
    monthlyEmi: { type: Number, required: true },
    totalInterest: { type: Number, required: true },
    totalPayment: { type: Number, required: true },
    interestRate: { type: Number, required: true },
  },
  { _id: false }
);

const statusHistorySubSchema = new Schema<IStatusHistorySubdoc>(
  {
    from: { type: String, default: '' },
    to: { type: String, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    remarks: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const loanApplicationSchema = new Schema<ILoanApplication>(
  {
    applicantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullName: { type: String, trim: true },
    email: { type: String, lowercase: true },
    phone: { type: String },
    dateOfBirth: { type: Date },
    panNumber: { type: String, uppercase: true },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
    },
    loanType: {
      type: String,
      enum: ['personal', 'business', 'education', 'home'],
      required: true,
    },
    amount: { type: Number, required: true, min: 10000, max: 10000000 },
    tenure: { type: Number, required: true, min: 3, max: 360 },
    purpose: { type: String, required: true },
    interestRate: { type: Number },
    employmentType: {
      type: String,
      enum: ['salaried', 'self-employed', 'student'],
    },
    monthlyIncome: { type: Number },
    employerName: { type: String },
    documents: { type: [documentSubSchema], default: [] },
    fileUrl: { type: String },
    fileUrls: { type: [String], default: [] },
    creditScore: { type: Number, min: 0, max: 100 },
    riskCategory: {
      type: String,
      enum: ['low', 'medium', 'high', 'very_high'],
    },
    scoringBreakdown: { type: scoringBreakdownSchema },
    scoredAt: { type: Date },
    emiDetails: { type: emiDetailsSchema },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'disbursed'],
      default: 'draft',
      required: true,
    },
    statusHistory: { type: [statusHistorySubSchema], default: [] },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewRemarks: { type: String },
    approvedAmount: { type: Number },
    rejectionReason: { type: String },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

loanApplicationSchema.index({ applicantId: 1, createdAt: -1 });
loanApplicationSchema.index({ status: 1, createdAt: -1 });
loanApplicationSchema.index({ applicantId: 1, status: 1 });
loanApplicationSchema.index({ assignedTo: 1, status: 1 });
loanApplicationSchema.index({ 'documents.s3Key': 1 }, { sparse: true });

export default mongoose.model<ILoanApplication>('LoanApplication', loanApplicationSchema);
