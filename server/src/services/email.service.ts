import nodemailer from 'nodemailer';
import logger from '../utils/logger';

let transporter: nodemailer.Transporter | null = null;

const initTransporter = async () => {
  if (transporter) return transporter;
  
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
    logger.info(`Ethereal Email Transporter initialized. User: ${testAccount.user}`);
    return transporter;
  } catch (err: any) {
    logger.error('Failed to initialize Ethereal transporter', { error: err.message });
    throw err;
  }
};

export class EmailService {
  static async sendApplicationReceived(email: string, name: string) {
    const tp = await initTransporter();
    
    const info = await tp.sendMail({
      from: '"CreditPulse Notifications" <no-reply@creditpulse.com>',
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
    
    logger.info(`Email sent to ${email}. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    return info;
  }

  static async sendApplicationDecision(email: string, name: string, status: 'approved' | 'rejected', amount?: number) {
    const tp = await initTransporter();
    
    const isApproved = status === 'approved';
    const statusText = isApproved ? 'APPROVED' : 'REJECTED';
    const color = isApproved ? '#10b981' : '#ef4444';
    
    const info = await tp.sendMail({
      from: '"CreditPulse Notifications" <no-reply@creditpulse.com>',
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
    
    logger.info(`Email sent to ${email}. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    return info;
  }
}
