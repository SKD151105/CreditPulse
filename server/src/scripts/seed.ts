import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';
import LoanApplication from '../models/LoanApplication';
import AuditLog from '../models/AuditLog';
import { hashPassword } from '../utils/password';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/creditpulse';

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    console.log('Clearing existing demo data...');
    const existingDemoUsers = await User.find({ email: /@demo\.com$/ }).select('_id');
    const existingDemoUserIds = existingDemoUsers.map(u => u._id);
    
    // Only delete data associated with demo users to protect real data
    await LoanApplication.deleteMany({ applicantId: { $in: existingDemoUserIds } });
    await AuditLog.deleteMany({ userId: { $in: existingDemoUserIds } });
    await User.deleteMany({ _id: { $in: existingDemoUserIds } });

    console.log('Creating demo users...');
    const adminPassword = await hashPassword('password123');
    const applicantPassword = await hashPassword('password123');

    const admin = await User.create({
      email: 'admin@demo.com',
      password: adminPassword,
      name: 'Demo Admin',
      role: 'admin',
    });

    const applicant1 = await User.create({
      email: 'applicant1@demo.com',
      password: applicantPassword,
      name: 'Ramesh Applicant',
      role: 'applicant',
    });

    const applicant2 = await User.create({
      email: 'applicant2@demo.com',
      password: applicantPassword,
      name: 'Shubham Applicant',
      role: 'applicant',
    });

    console.log('Creating 12 sample loans with activity timelines and audit logs...');
    
    const baseApp1 = {
      applicantId: applicant1._id,
      fullName: 'Ramesh Applicant',
      email: 'applicant1@demo.com',
      phone: '9876543210',
      dateOfBirth: new Date('1990-01-01'),
      panNumber: 'ABCDE1234F',
      address: { street: '123 Main St', city: 'Mumbai', state: 'MH', pincode: '400001' },
      employmentType: 'salaried',
      monthlyIncome: 60000,
      employerName: 'Tech Corp'
    };

    const baseApp2 = {
      applicantId: applicant2._id,
      fullName: 'Shubham Applicant',
      email: 'applicant2@demo.com',
      phone: '9988776655',
      dateOfBirth: new Date('1995-05-15'),
      panNumber: 'FGHIJ5678K',
      address: { street: '456 Park Ave', city: 'Bangalore', state: 'KA', pincode: '560001' },
      employmentType: 'self-employed',
      monthlyIncome: 120000
    };

    const otherAdminId = new mongoose.Types.ObjectId();
    const auditLogsToInsert: any[] = [];

    const generateTimeline = (loanId: mongoose.Types.ObjectId, applicantId: mongoose.Types.ObjectId, assignedAdminId: mongoose.Types.ObjectId | undefined, status: string, creationDate: Date) => {
      const history = [];
      const createTime = new Date(creationDate.getTime() - 24 * 60 * 60 * 1000); // Created 1 day before submit
      const submitTime = creationDate;
      const assignTime = new Date(creationDate.getTime() + 1 * 24 * 60 * 60 * 1000);
      const reviewTime = new Date(creationDate.getTime() + 2 * 24 * 60 * 60 * 1000);
      const finalTime = new Date(creationDate.getTime() + 4 * 24 * 60 * 60 * 1000);

      // Audit Log for Create
      auditLogsToInsert.push({
        userId: applicantId, action: 'CREATE_LOAN', resource: 'loan', resourceId: loanId, ipAddress: '127.0.0.1', userAgent: 'SeedScript', createdAt: createTime, updatedAt: createTime
      });

      // Audit Log for Submit
      auditLogsToInsert.push({
        userId: applicantId, action: 'SUBMIT_LOAN', resource: 'loan', resourceId: loanId, ipAddress: '127.0.0.1', userAgent: 'SeedScript', createdAt: submitTime, updatedAt: submitTime
      });

      if (assignedAdminId) {
        // Audit Log for Assign
        auditLogsToInsert.push({
          userId: assignedAdminId, action: 'ASSIGN_LOAN', resource: 'loan', resourceId: loanId, ipAddress: '127.0.0.1', userAgent: 'SeedScript', createdAt: assignTime, updatedAt: assignTime
        });
      }

      if (status === 'under_review' || status === 'approved' || status === 'rejected') {
        history.push({ from: 'submitted', to: 'under_review', changedBy: assignedAdminId, timestamp: reviewTime });
        auditLogsToInsert.push({
          userId: assignedAdminId, action: 'UPDATE_LOAN_STATUS', resource: 'loan', resourceId: loanId, details: { body: { status: 'under_review' } }, ipAddress: '127.0.0.1', userAgent: 'SeedScript', createdAt: reviewTime, updatedAt: reviewTime
        });
      }

      if (status === 'approved') {
        history.push({ from: 'under_review', to: 'approved', changedBy: assignedAdminId, remarks: 'Documents verified. Credit profile meets requirements.', timestamp: finalTime });
        auditLogsToInsert.push({
          userId: assignedAdminId, action: 'UPDATE_LOAN_STATUS', resource: 'loan', resourceId: loanId, details: { body: { status: 'approved', remarks: 'Documents verified. Credit profile meets requirements.' } }, ipAddress: '127.0.0.1', userAgent: 'SeedScript', createdAt: finalTime, updatedAt: finalTime
        });
      }

      if (status === 'rejected') {
        history.push({ from: 'under_review', to: 'rejected', changedBy: assignedAdminId, remarks: 'Insufficient credit history and income validation failed.', timestamp: finalTime });
        auditLogsToInsert.push({
          userId: assignedAdminId, action: 'UPDATE_LOAN_STATUS', resource: 'loan', resourceId: loanId, details: { body: { status: 'rejected', remarks: 'Insufficient credit history and income validation failed.' } }, ipAddress: '127.0.0.1', userAgent: 'SeedScript', createdAt: finalTime, updatedAt: finalTime
        });
      }

      return history;
    };

    const generateLoan = (base: any, data: any) => {
      const loanId = new mongoose.Types.ObjectId();
      const createdAt = data.createdAt || new Date();
      const statusHistory = generateTimeline(loanId, base.applicantId, data.assignedTo, data.status, createdAt);
      return {
        _id: loanId,
        ...base,
        ...data,
        statusHistory,
        fileUrls: ['https://creditpulse-demo-bucket.s3.ap-south-1.amazonaws.com/demo-document.pdf']
      };
    };

    const sampleLoans = [
      // 4 PENDING (SUBMITTED)
      generateLoan(baseApp1, { loanType: 'personal', amount: 50000, tenure: 12, purpose: 'Medical Emergency', status: 'submitted', creditScore: 72, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }),
      generateLoan(baseApp1, { loanType: 'education', amount: 100000, tenure: 24, purpose: 'Course Fees', status: 'submitted', creditScore: 70, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }),
      generateLoan(baseApp2, { loanType: 'business', amount: 200000, tenure: 36, purpose: 'Inventory Expansion', status: 'submitted', creditScore: 68, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }),
      generateLoan(baseApp2, { loanType: 'home', amount: 500000, tenure: 120, purpose: 'Home Renovation', status: 'submitted', creditScore: 75, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) }),

      // 3 UNDER REVIEW
      generateLoan(baseApp1, { loanType: 'personal', amount: 150000, tenure: 24, purpose: 'Wedding Expenses', status: 'under_review', creditScore: 71, assignedTo: admin._id, createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }),
      generateLoan(baseApp1, { loanType: 'business', amount: 800000, tenure: 60, purpose: 'Machinery', status: 'under_review', creditScore: 65, assignedTo: admin._id, createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000) }),
      generateLoan(baseApp2, { loanType: 'personal', amount: 2500000, tenure: 120, purpose: 'Property Purchase', status: 'under_review', creditScore: 76, assignedTo: otherAdminId, createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) }),

      // 3 APPROVED
      generateLoan(baseApp1, { loanType: 'education', amount: 75000, tenure: 12, purpose: 'Laptop Purchase', status: 'approved', creditScore: 82, assignedTo: admin._id, approvedAmount: 75000, createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) }),
      generateLoan(baseApp2, { loanType: 'home', amount: 1500000, tenure: 180, purpose: 'Apartment Purchase', status: 'approved', creditScore: 79, assignedTo: admin._id, approvedAmount: 1500000, createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000) }),
      generateLoan(baseApp2, { loanType: 'business', amount: 300000, tenure: 36, purpose: 'Working Capital', status: 'approved', creditScore: 74, assignedTo: admin._id, approvedAmount: 300000, createdAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000) }),

      // 2 REJECTED
      generateLoan(baseApp1, { loanType: 'business', amount: 5000000, tenure: 60, purpose: 'Venture Setup', status: 'rejected', creditScore: 45, assignedTo: admin._id, rejectionReason: 'Insufficient credit history and income validation failed.', createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) }),
      generateLoan(baseApp2, { loanType: 'personal', amount: 50000, tenure: 6, purpose: 'Vacation', status: 'rejected', creditScore: 50, assignedTo: admin._id, rejectionReason: 'Insufficient credit history and income validation failed.', createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000) })
    ];

    await LoanApplication.insertMany(sampleLoans);
    if (auditLogsToInsert.length > 0) {
      await AuditLog.insertMany(auditLogsToInsert);
    }

    console.log(`Seeding completed successfully! Created 12 loans and ${auditLogsToInsert.length} audit logs.`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
