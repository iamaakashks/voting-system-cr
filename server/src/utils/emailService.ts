import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';

// Set SendGrid API Key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const createTransporter = () => {
  const emailService = process.env.EMAIL_SERVICE?.toLowerCase();
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT;

  if (process.env.SENDGRID_API_KEY) {
    // If SendGrid API key is provided, we don't need a transporter
    return null;
  }

  if (!emailUser || !emailPassword) {
    console.warn('Email credentials not configured. Email functionality will not work.');
    return null; // Return null to indicate failure
  }

  let transporter;

  if (emailService === 'smtp' && emailHost && emailPort) {
    transporter = nodemailer.createTransport({
      host: emailHost,
      port: parseInt(emailPort, 10),
      secure: parseInt(emailPort, 10) === 465, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
  } else if (emailService) {
    transporter = nodemailer.createTransport({
      service: emailService,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
  } else {
    console.warn('Email service type not specified or invalid. Defaulting to a mock transporter.');
    return null;
  }

  return transporter;
};

export const sendVotingTicket = async (email: string, ticket: string, electionTitle: string) => {
  if (process.env.SENDGRID_API_KEY) {
    // Use SendGrid
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM || 'no-reply@verivote.com', // Use a verified sender
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
      await sgMail.send(msg);
      console.log(`Voting ticket sent to ${email} via SendGrid`);
      return true;
    } catch (error: any) {
      console.error('Error sending email with SendGrid:', error);
      if (error.response) {
        console.error(error.response.body)
      }
      throw new Error(`Failed to send email: ${error.message || 'Unknown error'}`);
    }
  } else {
    // Use Nodemailer
    const transporter = createTransporter();

    if (!transporter) {
      console.error('Email transporter could not be created. Check your environment variables.');
      throw new Error('Email service is not configured correctly.');
    }

    try {
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
    } catch (error: any) {
      console.error('Error sending email:', error);
      // Provide more detailed error message
      if (error.code === 'EAUTH') {
        throw new Error('Email authentication failed. Please check email credentials.');
      } else if (error.code === 'ECONNECTION') {
        throw new Error('Could not connect to email server. Please check network connection.');
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error('Connection to email server timed out. This could be due to a firewall or network issue.');
      } else if (error.code === 'EENVELOPE') {
        throw new Error('Email address in "From" or "To" field is invalid.');
      }
      throw new Error(`Failed to send email: ${error.message || 'Unknown error'}`);
    }
  }
};

export const sendNewElectionNotification = async (emails: string[], electionTitle: string, startDate: Date, endDate: Date) => {
  const subject = `New Election Created: ${electionTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">A New Election is Live!</h2>
      <p>Hello,</p>
      <p>A new election, <strong>${electionTitle}</strong>, has been created and is now live.</p>
      <p>You can cast your vote between:</p>
      <div style="background-color: #1f2937; color: #60a5fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p><strong>Start Date:</strong> ${startDate.toLocaleString()}</p>
        <p><strong>End Date:</strong> ${endDate.toLocaleString()}</p>
      </div>
      <p>Please log in to the VeriVote system to cast your vote:</p>
      <a href="https://crelectionblockchain.vercel.app/" style="display: block; width: 200px; margin: 20px auto; padding: 10px 20px; background-color: #2563eb; color: #ffffff; text-align: center; text-decoration: none; border-radius: 5px;">Go to Election</a>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">This is an automated message from VeriVote System.</p>
    </div>
  `;

  if (process.env.SENDGRID_API_KEY) {
    // Use SendGrid
    const msg = {
      to: emails,
      from: process.env.EMAIL_FROM || 'no-reply@verivote.com',
      subject,
      html,
    };

    try {
      await sgMail.send(msg);
      console.log(`New election notification sent to ${emails.length} students via SendGrid`);
      return true;
    } catch (error: any) {
      console.error('Error sending email with SendGrid:', error);
      if (error.response) {
        console.error(error.response.body)
      }
      throw new Error(`Failed to send email: ${error.message || 'Unknown error'}`);
    }
  } else {
    // Use Nodemailer
    const transporter = createTransporter();

    if (!transporter) {
      console.error('Email transporter could not be created. Check your environment variables.');
      throw new Error('Email service is not configured correctly.');
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: emails.join(','),
        subject,
        html,
      };

      await transporter.sendMail(mailOptions);
      console.log(`New election notification sent to ${emails.length} students`);
      return true;
    } catch (error: any) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message || 'Unknown error'}`);
    }
  }
};
