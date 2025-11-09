import nodemailer from 'nodemailer';
import dotenv from "dotenv"
dotenv.config()
// Create transporter - configure based on your email service
// For development, you can use Gmail, or a service like SendGrid, Mailgun, etc.
const createTransporter = () => {
  // Using Gmail as an example - you'll need to set up App Password in Gmail
  // For production, use a service like SendGrid, AWS SES, or Mailgun
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
    },
  });
};

export const sendVotingTicket = async (email: string, ticket: string, electionTitle: string) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
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
      text: `
Your Voting Ticket

Hello,

You have requested to vote in the election: ${electionTitle}

Your voting ticket is: ${ticket}

Important: This ticket is valid for 5 minutes only. Please use it immediately to cast your vote.

Do not share this ticket with anyone. It is your unique voting credential.

This is an automated message from VeriVote System.
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Voting ticket sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

