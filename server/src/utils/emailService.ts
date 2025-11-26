import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { sendVotingTicket as sendgridVotingTicket, sendNewElectionNotification as sendgridNewElectionNotification, sendWinnerNotification as sendgridWinnerNotification } from './sendgridService';

// Create Nodemailer transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify SMTP connection
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter.verify((error: any, success: any) => {
    if (error) {
      console.error('✗ SMTP connection error:', error.message);
      console.warn('⚠ Email functionality may not work. Check your Gmail App Password.');
    } else {
      console.log('✓ SMTP server is ready to send emails (Gmail)');
      console.log('✓ Email limit: 500 emails/day');
    }
  });
} else {
    console.warn('⚠ SMTP_USER or SMTP_PASS not found. Email functionality will not work.');
}

if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('✓ SendGrid is configured and ready to send emails.');
} else {
    console.warn('⚠ SENDGRID_API_KEY not found. SendGrid functionality will not work.');
}


export const sendVotingTicket = async (email: string, ticket: string, electionTitle: string) => {
  if (process.env.SENDGRID_API_KEY) {
    return sendgridVotingTicket(email, ticket, electionTitle);
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('Email service is not configured correctly.');
  }

  const mailOptions = {
    from: {
      name: process.env.EMAIL_FROM_NAME || 'VeriVote System',
      address: process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@verivote.com'
    },
    to: email,
    subject: `Your Voting Ticket for ${electionTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Your Voting Ticket</h2>
        <p>Hello,</p>
        <p>You have requested to vote in the election: <strong>${electionTitle}</strong></p>
        <p>Your voting ticket is:</p>
        <div style="background-color: #1f2937; color: #60a5fa; padding: 20px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
          ${ticket}
        </div>
        <p><strong>Important:</strong> This ticket is valid for <strong>5 minutes only</strong>. Please use it immediately to cast your vote.</p>
        <p>Do not share this ticket with anyone. It is your unique voting credential.</p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">This is an automated message from VeriVote System.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✓ Voting ticket sent to ${email} via Gmail SMTP`);
    return true;
  } catch (error: any) {
    console.error('✗ Error sending email with Gmail SMTP:', error.message);
    throw new Error(`Failed to send email: ${error.message || 'Unknown error'}`);
  }
};

export const sendNewElectionNotification = async (emails: string[], electionTitle: string, startDate: Date, endDate: Date) => {
    if (process.env.SENDGRID_API_KEY) {
        return sendgridNewElectionNotification(emails, electionTitle, startDate, endDate);
    }
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('Email service is not configured correctly.');
  }

  const subject = `New Election Created: ${electionTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">A New Election is Live!</h2>
      <p>Hello,</p>
      <p>A new election, <strong>${electionTitle}</strong>, has been created and is now live.</p>
      <p>You can cast your vote between:</p>
      <div style="background-color: #1f2937; color: #60a5fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p><strong>Start Date:</strong> ${startDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        <p><strong>End Date:</strong> ${endDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>
      <p>Please log in to the VeriVote system to cast your vote:</p>
      <a href="https://crelectionblockchain.vercel.app/" style="display: block; width: 200px; margin: 20px auto; padding: 10px 20px; background-color: #2563eb; color: #ffffff; text-align: center; text-decoration: none; border-radius: 5px;">Go to Election</a>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">This is an automated message from VeriVote System.</p>
    </div>
  `;

  const mailOptions = {
    from: {
      name: process.env.EMAIL_FROM_NAME || 'VeriVote System',
      address: process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@verivote.com'
    },
    to: emails,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✓ New election notification sent to ${emails.length} students via Gmail SMTP`);
    return true;
  } catch (error: any) {
    console.error('✗ Error sending email with Gmail SMTP:', error.message);
    throw new Error(`Failed to send email: ${error.message || 'Unknown error'}`);
  }
};

export const sendWinnerNotification = async (
  winnerEmails: string[],
  electionTitle: string,
  isTie: boolean,
  otherWinners: string[]
) => {
    if (process.env.SENDGRID_API_KEY) {
        return sendgridWinnerNotification(winnerEmails, electionTitle, isTie, otherWinners);
    }
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('Email service is not configured correctly.');
  }

  let html;

  if (isTie) {
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Congratulations on Your Election Victory!</h2>
        <p>Hello,</p>
        <p>Congratulations! You have been elected as one of the Class Representatives for the election: <strong>${electionTitle}</strong>.</p>
        <p>This was a tie, and you will be sharing the role with: <strong>${otherWinners.join(', ')}</strong>.</p>
        <p>We wish you the best in your new role.</p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">This is an automated message from VeriVote System.</p>
      </div>
    `;
  } else {
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Congratulations on Your Election Victory!</h2>
        <p>Hello,</p>
        <p>Congratulations! You have been elected as the new Class Representative for the election: <strong>${electionTitle}</strong>.</p>
        <p>We wish you the best in your new role.</p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">This is an automated message from VeriVote System.</p>
      </div>
    `;
  }
  const mailOptions = {
    from: {
      name: process.env.EMAIL_FROM_NAME || 'VeriVote System',
      address: process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@verivote.com'
    },
    to: winnerEmails,
    subject: `Congratulations! You've Won the Election: ${electionTitle}`,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✓ Winner notification sent to ${winnerEmails.length} student(s) via Gmail SMTP`);
    return true;
  } catch (error: any) {
    console.error('✗ Error sending email with Gmail SMTP:', error.message);
    throw new Error(`Failed to send email: ${error.message || 'Unknown error'}`);
  }
};