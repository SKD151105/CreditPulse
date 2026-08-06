declare global {
  namespace Express {
    interface Request {
      user?: { _id: string; email: string; role: 'applicant' | 'admin'; name: string };
    }
  }
}

export {};
