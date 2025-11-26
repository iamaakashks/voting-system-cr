import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';

// Determine which email service to use
const USE_SENDGRID = !!process.env.SENDGRID_API_KEY;

if (USE_SENDGRID) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  console.log('✓ Using SendGrid API for email delivery');
  console.log('✓ SendGrid is configured and ready');
} else {
  console.log('ℹ Using SMTP (Gmail) for email delivery');
}

// Create Nodemailer transporter with Gmail SMTP (fallback)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify SMTP connection only if not using SendGrid
if (!USE_SENDGRID) {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter.verify((error: Error | null, success: true | undefined) => {
      if (error) {
        console.error('✗ SMTP connection error:', error.message);
        console.warn('⚠ Email functionality may not work. Check your Gmail App Password.');
        console.warn('💡 TIP: Consider using SendGrid API instead (set SENDGRID_API_KEY)');
      } else {
        console.log('✓ SMTP server is ready to send emails (Gmail)');
        console.log('✓ Email limit: 500 emails/day');
      }
    });
  } else {
    console.warn('⚠ SMTP_USER or SMTP_PASS not found. Email functionality will not work.');
    console.warn('💡 TIP: Set SENDGRID_API_KEY to use SendGrid API instead');
  }
}

export const sendVotingTicket = async (email: string, ticket: string, electionTitle: string) => {
  console.log(`📧 Attempting to send voting ticket to: ${email}`);
  console.log(`📧 Email Service: ${USE_SENDGRID ? 'SendGrid API' : 'SMTP'}`);

  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@verivote.com';
  const fromName = process.env.EMAIL_FROM_NAME || 'VeriVote System';
  
  const htmlContent = `
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
  `;

  try {
    if (USE_SENDGRID) {
      // Use SendGrid API
      const msg = {
        to: email,
        from: {
          email: fromAddress,
          name: fromName
        },
        subject: `Your Voting Ticket for ${electionTitle}`,
        html: htmlContent,
      };

      console.log(`📧 Sending via SendGrid from: ${fromAddress} to: ${email}`);
      await sgMail.send(msg);
      console.log(`✓ Voting ticket sent successfully to ${email} via SendGrid API`);
      return true;
    } else {
      // Use SMTP
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        const errorMsg = 'Email service is not configured correctly. Neither SENDGRID_API_KEY nor SMTP credentials are set.';
        console.error(`❌ ${errorMsg}`);
        throw new Error(errorMsg);
      }

      const mailOptions = {
        from: {
          name: fromName,
          address: fromAddress
        },
        to: email,
        subject: `Your Voting Ticket for ${electionTitle}`,
        html: htmlContent,
      };

      console.log(`📧 Sending via SMTP from: ${fromAddress} to: ${email}`);
      const info = await transporter.sendMail(mailOptions);
      console.log(`✓ Voting ticket sent successfully to ${email} via Gmail SMTP`);
      console.log(`✓ Message ID: ${info.messageId}`);
      return true;
    }
  } catch (error: any) {
    console.error('❌ Error sending voting ticket email:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error response:', error.response);
    throw new Error(`Failed to send email: ${error.message || 'Unknown error'}`);
  }
};

export const sendNewElectionNotification = async (emails: string[], electionTitle: string, startDate: Date, endDate: Date) => {
  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@verivote.com';
  const fromName = process.env.EMAIL_FROM_NAME || 'VeriVote System';
  
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

  try {
    if (USE_SENDGRID) {
      // Use SendGrid API
      const msg = {
        to: emails,
        from: {
          email: fromAddress,
          name: fromName
        },
        subject,
        html,
      };

      await sgMail.send(msg);
      console.log(`✓ New election notification sent to ${emails.length} students via SendGrid API`);
      return true;
    } else {
      // Use SMTP
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('Email service is not configured correctly. Neither SENDGRID_API_KEY nor SMTP credentials are set.');
      }

      const mailOptions = {
        from: {
          name: fromName,
          address: fromAddress
        },
        to: emails,
        subject,
        html,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✓ New election notification sent to ${emails.length} students via Gmail SMTP`);
      return true;
    }
  } catch (error: any) {
    console.error('✗ Error sending email:', error.message);
    throw new Error(`Failed to send email: ${error.message || 'Unknown error'}`);
  }
};

export const sendWinnerNotification = async (
  winnerEmails: string[],
  electionTitle: string,
  isTie: boolean,
  otherWinners: string[]
) => {
  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@verivote.com';
  const fromName = process.env.EMAIL_FROM_NAME || 'VeriVote System';

  const subject = `Congratulations! You've Won the Election: ${electionTitle}`;
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

  try {
    if (USE_SENDGRID) {
      // Use SendGrid API
      const msg = {
        to: winnerEmails,
        from: {
          email: fromAddress,
          name: fromName
        },
        subject,
        html,
      };

      await sgMail.send(msg);
      console.log(`✓ Winner notification sent to ${winnerEmails.length} student(s) via SendGrid API`);
      return true;
    } else {
      // Use SMTP
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('Email service is not configured correctly. Neither SENDGRID_API_KEY nor SMTP credentials are set.');
      }

      const mailOptions = {
        from: {
          name: fromName,
          address: fromAddress
        },
        to: winnerEmails,
        subject,
        html,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✓ Winner notification sent to ${winnerEmails.length} student(s) via Gmail SMTP`);
      return true;
    }
  } catch (error: any) {
    console.error('✗ Error sending email:', error.message);
    throw new Error(`Failed to send email: ${error.message || 'Unknown error'}`);
  }
};
