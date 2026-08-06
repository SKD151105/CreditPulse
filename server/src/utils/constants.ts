export const FSM_TRANSITIONS: Record<string, string[]> = {
  draft: ['submitted'],
  submitted: ['under_review'],
  under_review: ['approved', 'rejected'],
  approved: ['disbursed'],
  rejected: [],
  disbursed: [],
};

export const LOAN_STATUSES: string[] = [
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'disbursed',
];

export const LOAN_TYPES: string[] = ['personal', 'business', 'education', 'home'];

export const DOCUMENT_TYPES: string[] = [
  'aadhaar',
  'pan',
  'income_proof',
  'bank_statement',
  'address_proof',
  'other',
];

export const RATE_LIMITS = {
  AUTH_REGISTER: { points: 5, duration: 60 },
  AUTH_LOGIN: { points: 10, duration: 60 },
  API_GENERAL: { points: 60, duration: 60 },
  UPLOAD: { points: 10, duration: 60 },
  ANALYTICS: { points: 30, duration: 60 },
};

export const CACHE_TTL = {
  USER: 900, // 15 minutes
  LOAN: 600, // 10 minutes
  LOAN_LIST: 300, // 5 minutes
  ANALYTICS: 300, // 5 minutes
  ADMIN_LOANS: 120, // 2 minutes
};

export const isValidTransition = (from: string, to: string): boolean => {
  const allowed = FSM_TRANSITIONS[from];
  if (!allowed) {
    return false;
  }
  return allowed.includes(to);
};
