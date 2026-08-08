import nodemailer from 'nodemailer';
import logger from '../utils/logger';

let transporter: nodemailer.Transporter | null = null;

const initTransporter = async () => {
  if (transporter) return transporter;
  
  try {
    // If real SMTP credentials are provided in .env, use them
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465, 
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      logger.info(`Real SMTP Transporter initialized using host: ${process.env.SMTP_HOST}`);
      return transporter;
    }

    // Otherwise, fallback to Ethereal (Development Mode)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, 
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info(`Ethereal Email Transporter initialized. User: ${testAccount.user}`);
    return transporter;
  } catch (err: any) {
    logger.error('Failed to initialize transporter', { error: err.message });
    throw err;
  }
};

const getFromAddress = () => {
  return process.env.SMTP_FROM || '"CreditPulse Notifications" <no-reply@creditpulse.com>';
};

export class EmailService {
  static async sendApplicationReceived(email: string, name: string) {
    const tp = await initTransporter();
    
    const info = await tp.sendMail({
      from: getFromAddress(),
      to: email,
      subject: 'Application Received - CreditPulse',
      text: `Dear ${name},\n\nWe have successfully received your loan application! Our team is currently reviewing your details. We will notify you once a decision is made.\n\nThank you for choosing CreditPulse!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; color: #111827;">
          <h2 style="color: #4f46e5;">Application Received</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>We have successfully received your loan application! Our team is currently reviewing your details.</p>
          <p>We will notify you as soon as a decision is made.</p>
          <hr style="border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280;">Thank you for choosing CreditPulse!</p>
        </div>
      `,
    });
    
    if (info.messageId && !process.env.SMTP_HOST) {
      logger.info(`Email sent to ${email}. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } else {
      logger.info(`Real email successfully sent to ${email}`);
    }
    return info;
  }

  static async sendApplicationDecision(email: string, name: string, status: 'approved' | 'rejected', amount?: number) {
    const tp = await initTransporter();
    
    const isApproved = status === 'approved';
    const statusText = isApproved ? 'APPROVED' : 'REJECTED';
    const color = isApproved ? '#10b981' : '#ef4444';
    
    const info = await tp.sendMail({
      from: getFromAddress(),
      to: email,
      subject: `Application ${statusText} - CreditPulse`,
      text: `Dear ${name},\n\nYour loan application has been ${statusText}.${isApproved ? ` Your approved amount is ₹${amount}.` : ''}\n\nLogin to your dashboard to view more details.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; color: #111827;">
          <h2 style="color: ${color};">Application ${statusText}</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>Your loan application has been carefully reviewed and has been <strong style="color: ${color};">${statusText}</strong>.</p>
          ${isApproved ? `<p>Congratulations! Your approved loan amount is <strong>₹${amount?.toLocaleString()}</strong>.</p>` : '<p>We are sorry, but we cannot proceed with your application at this time.</p>'}
          <p>Please log in to your dashboard to view the full details ${isApproved ? 'and download your official approval letter' : ''}.</p>
          <hr style="border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280;">Thank you for choosing CreditPulse!</p>
        </div>
      `,
    });
    
    if (info.messageId && !process.env.SMTP_HOST) {
      logger.info(`Email sent to ${email}. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } else {
      logger.info(`Real email successfully sent to ${email}`);
    }
    return info;
  }
}
