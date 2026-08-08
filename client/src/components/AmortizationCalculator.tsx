import { useState, useMemo, useEffect } from 'react';
import { Calculator, DollarSign, Percent, Calendar } from 'lucide-react';


interface Props {
  initialAmount?: number;
  initialTenure?: number;
}

export default function AmortizationCalculator({ initialAmount = 100000, initialTenure = 12 }: Props) {
  const [amount, setAmount] = useState(initialAmount);
  const [tenure, setTenure] = useState(initialTenure);
  const [interestRate, setInterestRate] = useState(12);

  // Sync with parent form if they change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (initialAmount && initialAmount > 0) setAmount(initialAmount);
    }, 0);
    return () => clearTimeout(timer);
  }, [initialAmount]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (initialTenure && initialTenure > 0) setTenure(initialTenure);
    }, 0);
    return () => clearTimeout(timer);
  }, [initialTenure]);

  const { emi, totalInterest, totalPayable } = useMemo(() => {
    const P = amount;
    const R = interestRate / 12 / 100;
    const N = tenure;
    
    if (P <= 0 || R <= 0 || N <= 0) return { emi: 0, totalInterest: 0, totalPayable: 0 };
    
    const emiCalc = P * R * Math.pow(1 + R, N) / (Math.pow(1 + R, N) - 1);
    const totalPayableCalc = emiCalc * N;
    const totalInterestCalc = totalPayableCalc - P;
    
    return {
      emi: Math.round(emiCalc),
      totalInterest: Math.round(totalInterestCalc),
      totalPayable: Math.round(totalPayableCalc)
    };
  }, [amount, interestRate, tenure]);

  const principalPercentage = totalPayable > 0 ? (amount / totalPayable) * 100 : 100;
  
  return (
    <div className="glass border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl p-8 sticky top-24">
      <div className="flex items-center mb-8 text-indigo-400">
        <Calculator className="h-6 w-6 mr-3" />
        <h2 className="text-2xl font-bold text-white">EMI Estimator</h2>
      </div>

      <div className="space-y-6">
        {/* Amount Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-300 flex items-center">
              <DollarSign className="h-4 w-4 mr-1 text-gray-400" /> Loan Amount
            </label>
            <span className="font-bold text-white">₹{amount.toLocaleString()}</span>
          </div>
          <input 
            type="range" 
            min="10000" 
            max="1000000" 
            step="10000"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* Tenure Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-300 flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-gray-400" /> Tenure
            </label>
            <span className="font-bold text-white">{tenure} Months</span>
          </div>
          <input 
            type="range" 
            min="3" 
            max="60" 
            step="1"
            value={tenure}
            onChange={(e) => setTenure(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

        {/* Interest Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-300 flex items-center">
              <Percent className="h-4 w-4 mr-1 text-gray-400" /> Interest Rate (p.a.)
            </label>
            <span className="font-bold text-white">{interestRate}%</span>
          </div>
          <input 
            type="range" 
            min="5" 
            max="25" 
            step="0.5"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
      </div>

      <hr className="border-white/10 my-8" />

      {/* Results */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
          <p className="text-xs text-gray-400 mb-1">Monthly EMI</p>
          <p className="text-2xl font-bold text-white">₹{emi.toLocaleString()}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
          <p className="text-xs text-gray-400 mb-1">Total Interest</p>
          <p className="text-xl font-bold text-emerald-400">₹{totalInterest.toLocaleString()}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/5 col-span-2">
          <p className="text-xs text-gray-400 mb-1">Total Amount Payable</p>
          <p className="text-3xl font-bold text-indigo-400">₹{totalPayable.toLocaleString()}</p>
        </div>
      </div>

      {/* Donut Chart via Conic Gradient */}
      <div className="flex items-center justify-between">
        <div className="relative h-24 w-24">
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(#6366f1 ${principalPercentage}%, #10b981 ${principalPercentage}% 100%)`
            }}
          ></div>
          <div className="absolute inset-2 bg-[#0f1115] rounded-full"></div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>
            <div>
              <p className="text-xs text-gray-400">Principal</p>
              <p className="text-sm font-semibold text-white">{principalPercentage.toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
            <div>
              <p className="text-xs text-gray-400">Interest</p>
              <p className="text-sm font-semibold text-white">{(100 - principalPercentage).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
