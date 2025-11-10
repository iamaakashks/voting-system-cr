# Email Setup Instructions

This application uses nodemailer to send voting tickets via email. You need to configure email settings before the ticket system will work.

## Installation

First, install nodemailer and its types:

```bash
cd server
npm install nodemailer
npm install --save-dev @types/nodemailer
```

## Environment Variables

Create or update your `.env` file in the `server` directory with the following variables:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## Gmail Setup (Development)

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Go to App Passwords (https://myaccount.google.com/apppasswords)
4. Generate an app password for "Mail"
5. Use this app password as `EMAIL_PASSWORD` in your `.env` file

## Alternative Email Services

### SendGrid (Recommended for Render)

If you are deploying on Render or another platform that blocks SMTP, using the SendGrid API is the recommended approach.

1.  **Create a SendGrid Account:** Sign up for a free account at [sendgrid.com](https://sendgrid.com).
2.  **Create an API Key:** Go to **Settings -> API Keys** in your SendGrid dashboard and create a new API key with "Full Access".
3.  **Verify a Sender:** You must verify a "Single Sender" or a "Domain" to send emails from. This is a security measure to prevent spam. You can do this in the **Settings -> Sender Authentication** section of your SendGrid dashboard.
4.  **Set Environment Variables:** Update your `.env` file in the `server` directory with the following:

    ```env
    SENDGRID_API_KEY=your-sendgrid-api-key
    EMAIL_FROM=your-verified-sender-email@example.com
    ```

    - `SENDGRID_API_KEY`: The API key you generated in step 2.
    - `EMAIL_FROM`: The email address you verified in step 3.

### Mailgun
```env
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your-mailgun-username
EMAIL_PASSWORD=your-mailgun-password
```

### AWS SES
```env
EMAIL_SERVICE=smtp
EMAIL_HOST=email-smtp.region.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-aws-access-key
EMAIL_PASSWORD=your-aws-secret-key
```

## Testing

After setting up email, test the system by:
1. Logging in as a student
2. Clicking "Cast Vote" on a live election
3. Checking your email for the voting ticket
4. Using the ticket to vote (valid for 5 minutes)

## Notes

- Tickets expire after 5 minutes
- Each ticket can only be used once
- Tickets are validated using both email and ticket string
- Old unused tickets are automatically deleted when a new ticket is requested



