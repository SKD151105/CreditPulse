

interface ApprovalLetterProps {
  loan: {
    _id: string;
    fullName?: string;
    loanType?: string;
    purpose: string;
    amount: number;
    approvedAmount?: number;
    term?: number;
    tenure?: number;
    createdAt?: string;
  };
  user?: {
    name?: string;
  } | null;
}

export default function ApprovalLetter({ loan, user }: ApprovalLetterProps) {
  return (
    <div className="print-only fixed inset-0 bg-white text-black z-50 p-12">
      <div className="max-w-3xl mx-auto border border-gray-300 p-12 shadow-sm relative h-full">
        <div className="flex justify-between items-start border-b-2 border-indigo-600 pb-6 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-indigo-700 tracking-tighter">CreditPulse</h1>
            <p className="text-sm text-gray-500 mt-1">Empowering Your Financial Future</p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>123 Financial District</p>
            <p>Mumbai, MH 400001</p>
            <p>support@creditpulse.com</p>
            <p>+91 (800) 123-4567</p>
          </div>
        </div>

        <div className="mb-10 text-right">
          <p className="font-semibold text-gray-800">Date: {new Date().toLocaleDateString()}</p>
          <p className="font-semibold text-gray-800">Application ID: {loan._id}</p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Dear {loan.fullName || user?.name || 'Applicant'},</h2>
          <p className="text-gray-700 leading-relaxed">
            We are thrilled to inform you that your loan application with CreditPulse has been successfully reviewed and <strong className="text-emerald-600">APPROVED</strong>.
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">Approved Loan Summary</h3>
          <div className="grid grid-cols-2 gap-y-4">
            <div>
              <p className="text-sm text-gray-500">Loan Type</p>
              <p className="font-semibold capitalize">{loan.loanType || 'Personal'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Purpose</p>
              <p className="font-semibold capitalize">{loan.purpose}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Requested Amount</p>
              <p className="font-semibold">₹{loan.amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Approved Amount</p>
              <p className="font-semibold text-emerald-600">₹{(loan.approvedAmount || loan.amount).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Approved Tenure</p>
              <p className="font-semibold">{loan.term || loan.tenure || 12} Months</p>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <p className="text-gray-700 leading-relaxed mb-4">
            The funds will be disbursed to your registered bank account within 24-48 business hours. If you have any questions or require further assistance, please do not hesitate to contact our support team.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Thank you for choosing CreditPulse as your trusted financial partner.
          </p>
        </div>

        <div className="absolute bottom-12 left-12">
          <div className="mb-2">
            {/* Fake Signature */}
            <span className="font-signature text-3xl text-blue-900 italic opacity-80">R. Sharma</span>
          </div>
          <div className="w-48 h-px bg-gray-400 mb-2"></div>
          <p className="font-bold text-gray-800">Rajesh Sharma</p>
          <p className="text-sm text-gray-600">Chief Credit Officer</p>
          <p className="text-sm text-indigo-600 font-semibold mt-1">CreditPulse Inc.</p>
        </div>
        
        {/* Print Instruction for user */}
        <div className="absolute bottom-4 right-12 text-xs text-gray-400">
          This is an electronically generated official document and does not require a physical signature.
        </div>
      </div>
    </div>
  );
}
