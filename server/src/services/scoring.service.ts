import LoanApplication, { IScoringBreakdown } from '../models/LoanApplication';
import logger from '../utils/logger';
import { NotFoundError } from '../utils/errors';

export type RiskCategory = 'low' | 'medium' | 'high' | 'very_high';

export class ScoringService {
  private static scoreIncomeToLoanRatio(income: number, amount: number, tenure: number): number {
    if (!income || income <= 0) return 0;
    
    // Monthly payment roughly
    const monthlyPayment = amount / tenure;
    const ratio = monthlyPayment / income;

    if (ratio < 0.2) return 100;
    if (ratio < 0.4) return 80;
    if (ratio < 0.6) return 50;
    return 10;
  }

  private static scoreEmployment(employmentType: string | undefined): number {
    switch (employmentType) {
      case 'salaried':
        return 100;
      case 'self-employed':
        return 70;
      case 'student':
        return 30;
      default:
        return 0;
    }
  }

  private static scoreLoanToIncome(amount: number, monthlyIncome: number): number {
    if (!monthlyIncome || monthlyIncome <= 0) return 0;
    
    const annualIncome = monthlyIncome * 12;
    const ratio = amount / annualIncome;

    if (ratio < 0.5) return 100;
    if (ratio < 1) return 80;
    if (ratio < 2) return 50;
    return 20;
  }

  private static scoreDocuments(documents: any[]): number {
    if (!documents || documents.length === 0) return 0;
    const docTypes = documents.map((d) => d.type);
    
    const hasAadhaar = docTypes.includes('aadhaar');
    const hasPan = docTypes.includes('pan');
    const hasIncomeProof = docTypes.includes('income_proof');

    if (!hasAadhaar || !hasPan) return 0;
    if (!hasIncomeProof) return 60;
    return 100;
  }

  private static scoreLoanType(loanType: string): number {
    switch (loanType) {
      case 'home':
        return 100;
      case 'education':
        return 80;
      case 'business':
        return 60;
      case 'personal':
        return 40;
      default:
        return 0;
    }
  }

  public static async calculateScore(loanId: string) {
    const loan = await LoanApplication.findById(loanId);
    
    if (!loan) {
      throw new NotFoundError('Loan application not found');
    }

    const income = loan.monthlyIncome || 0;
    const amount = loan.amount;
    const tenure = loan.tenure;

    const scores = {
      incomeToLoan: this.scoreIncomeToLoanRatio(income, amount, tenure),
      employment: this.scoreEmployment(loan.employmentType),
      loanToIncome: this.scoreLoanToIncome(amount, income),
      documents: this.scoreDocuments(loan.documents),
      loanType: this.scoreLoanType(loan.loanType),
    };

    const weights = {
      incomeToLoan: 0.30,
      employment: 0.20,
      loanToIncome: 0.20,
      documents: 0.15,
      loanType: 0.15,
    };

    const finalScore = Math.round(
      (scores.incomeToLoan * weights.incomeToLoan) +
      (scores.employment * weights.employment) +
      (scores.loanToIncome * weights.loanToIncome) +
      (scores.documents * weights.documents) +
      (scores.loanType * weights.loanType)
    );

    let riskCategory: RiskCategory;
    if (finalScore > 80) {
      riskCategory = 'low';
    } else if (finalScore > 60) {
      riskCategory = 'medium';
    } else if (finalScore > 40) {
      riskCategory = 'high';
    } else {
      riskCategory = 'very_high';
    }

    const breakdown: IScoringBreakdown = {
      incomeToLoanRatio: { 
        score: scores.incomeToLoan, 
        weight: weights.incomeToLoan, 
        details: 'Ratio of estimated monthly payment to monthly income' 
      },
      employmentStability: { 
        score: scores.employment, 
        weight: weights.employment, 
        details: 'Based on employment type category' 
      },
      loanToIncomeRatio: { 
        score: scores.loanToIncome, 
        weight: weights.loanToIncome, 
        details: 'Ratio of total loan amount to annual income' 
      },
      documentCompleteness: { 
        score: scores.documents, 
        weight: weights.documents, 
        details: 'Presence of essential KYC and income documents' 
      },
      loanTypeRisk: { 
        score: scores.loanType, 
        weight: weights.loanType, 
        details: 'Inherent risk associated with the specific loan product type' 
      },
    };

    loan.creditScore = finalScore;
    loan.riskCategory = riskCategory;
    loan.scoringStatus = 'completed';
    loan.scoringError = undefined;
    loan.scoringBreakdown = breakdown;
    loan.scoredAt = new Date();

    await loan.save();

    logger.info(`Calculated credit score for loan ${loanId}: ${finalScore} (${riskCategory})`);

    return loan;
  }
}
