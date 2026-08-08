import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';
import LoanApplication from '../models/LoanApplication';
import { hashPassword } from '../utils/password';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/creditpulse';

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    console.log('Clearing existing data...');
    await User.deleteMany({});
    await LoanApplication.deleteMany({});

    console.log('Creating users...');
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

    console.log('Creating loans...');
    const sampleLoans = [
      {
        applicantId: applicant1._id,
        fullName: 'Ramesh Applicant',
        email: 'applicant1@demo.com',
        phone: '9876543210',
        dateOfBirth: new Date('1990-01-01'),
        panNumber: 'ABCDE1234F',
        address: { street: '123 Main St', city: 'Mumbai', state: 'MH', pincode: '400001' },
        loanType: 'personal',
        amount: 25000,
        tenure: 12,
        purpose: 'Medical Emergency',
        employmentType: 'salaried',
        monthlyIncome: 60000,
        employerName: 'Tech Corp',
        status: 'draft',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      },
      {
        applicantId: applicant1._id,
        fullName: 'Ramesh Applicant',
        email: 'applicant1@demo.com',
        phone: '9876543210',
        dateOfBirth: new Date('1990-01-01'),
        panNumber: 'ABCDE1234F',
        address: { street: '123 Main St', city: 'Mumbai', state: 'MH', pincode: '400001' },
        loanType: 'business',
        amount: 500000,
        tenure: 36,
        purpose: 'Inventory Buyout',
        employmentType: 'salaried',
        monthlyIncome: 60000,
        employerName: 'Tech Corp',
        status: 'submitted',
        creditScore: 68,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        applicantId: applicant1._id,
        fullName: 'Ramesh Applicant',
        email: 'applicant1@demo.com',
        phone: '9876543210',
        dateOfBirth: new Date('1990-01-01'),
        panNumber: 'ABCDE1234F',
        address: { street: '123 Main St', city: 'Mumbai', state: 'MH', pincode: '400001' },
        loanType: 'education',
        amount: 150000,
        tenure: 24,
        purpose: 'College Tuition',
        employmentType: 'salaried',
        monthlyIncome: 60000,
        employerName: 'Tech Corp',
        status: 'approved',
        creditScore: 82,
        approvedAmount: 150000,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        applicantId: applicant2._id,
        fullName: 'Shubham Applicant',
        email: 'applicant2@demo.com',
        phone: '9988776655',
        dateOfBirth: new Date('1995-05-15'),
        panNumber: 'FGHIJ5678K',
        address: { street: '456 Park Ave', city: 'Bangalore', state: 'KA', pincode: '560001' },
        loanType: 'home',
        amount: 4500000,
        tenure: 240,
        purpose: 'House Construction',
        employmentType: 'self-employed',
        monthlyIncome: 120000,
        status: 'under_review',
        creditScore: 75,
        assignedTo: admin._id,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        applicantId: applicant2._id,
        fullName: 'Shubham Applicant',
        email: 'applicant2@demo.com',
        phone: '9988776655',
        dateOfBirth: new Date('1995-05-15'),
        panNumber: 'FGHIJ5678K',
        address: { street: '456 Park Ave', city: 'Bangalore', state: 'KA', pincode: '560001' },
        loanType: 'personal',
        amount: 50000,
        tenure: 6,
        purpose: 'Vacation',
        employmentType: 'self-employed',
        monthlyIncome: 120000,
        status: 'rejected',
        creditScore: 40,
        rejectionReason: 'Low credit score and insufficient repayment history.',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      },
      {
        applicantId: applicant2._id,
        fullName: 'Shubham Applicant',
        email: 'applicant2@demo.com',
        phone: '9988776655',
        dateOfBirth: new Date('1995-05-15'),
        panNumber: 'FGHIJ5678K',
        address: { street: '456 Park Ave', city: 'Bangalore', state: 'KA', pincode: '560001' },
        loanType: 'business',
        amount: 800000,
        tenure: 48,
        purpose: 'Equipment Purchase',
        employmentType: 'self-employed',
        monthlyIncome: 120000,
        status: 'submitted',
        creditScore: 71,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        applicantId: applicant1._id,
        fullName: 'Ramesh Applicant',
        email: 'applicant1@demo.com',
        phone: '9876543210',
        dateOfBirth: new Date('1990-01-01'),
        panNumber: 'ABCDE1234F',
        address: { street: '123 Main St', city: 'Mumbai', state: 'MH', pincode: '400001' },
        loanType: 'personal',
        amount: 100000,
        tenure: 12,
        purpose: 'Home Renovation',
        employmentType: 'salaried',
        monthlyIncome: 60000,
        status: 'under_review',
        creditScore: 65,
        assignedTo: admin._id,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        applicantId: applicant1._id,
        fullName: 'Ramesh Applicant',
        email: 'applicant1@demo.com',
        phone: '9876543210',
        dateOfBirth: new Date('1990-01-01'),
        panNumber: 'ABCDE1234F',
        address: { street: '123 Main St', city: 'Mumbai', state: 'MH', pincode: '400001' },
        loanType: 'personal',
        amount: 30000,
        tenure: 6,
        purpose: 'Car Repair',
        employmentType: 'salaried',
        monthlyIncome: 60000,
        status: 'approved',
        creditScore: 78,
        approvedAmount: 30000,
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
      },
      {
        applicantId: applicant2._id,
        fullName: 'Shubham Applicant',
        email: 'applicant2@demo.com',
        phone: '9988776655',
        dateOfBirth: new Date('1995-05-15'),
        panNumber: 'FGHIJ5678K',
        address: { street: '456 Park Ave', city: 'Bangalore', state: 'KA', pincode: '560001' },
        loanType: 'education',
        amount: 350000,
        tenure: 48,
        purpose: 'Higher Studies',
        employmentType: 'self-employed',
        monthlyIncome: 120000,
        status: 'rejected',
        creditScore: 55,
        rejectionReason: 'Course not recognized by partnered institutions.',
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
      },
      {
        applicantId: applicant2._id,
        fullName: 'Shubham Applicant',
        email: 'applicant2@demo.com',
        phone: '9988776655',
        dateOfBirth: new Date('1995-05-15'),
        panNumber: 'FGHIJ5678K',
        address: { street: '456 Park Ave', city: 'Bangalore', state: 'KA', pincode: '560001' },
        loanType: 'personal',
        amount: 75000,
        tenure: 12,
        purpose: 'Wedding Expenses',
        employmentType: 'self-employed',
        monthlyIncome: 120000,
        status: 'submitted',
        creditScore: 73,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];

    await LoanApplication.insertMany(sampleLoans.map(loan => ({
      ...loan,
      fileUrls: ['https://creditpulse-demo-bucket.s3.ap-south-1.amazonaws.com/demo-document.pdf']
    })));

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
