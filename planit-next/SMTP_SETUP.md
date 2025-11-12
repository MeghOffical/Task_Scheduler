# SMTP Email Setup Guide (Nodemailer)

This guide will help you set up SMTP email for sending password reset emails using Nodemailer.

## Option 1: Gmail (Easiest for Development)

### Step 1: Enable App Password in Gmail

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** in the left sidebar
3. Enable **2-Step Verification** if not already enabled
4. Scroll down to **App passwords**
5. Click **App passwords**
6. Select **Mail** and **Other (Custom name)**
7. Enter "Plan-it" as the name
8. Click **Generate**
9. **Copy the 16-character password** (you'll need this)

### Step 2: Add to .env File

Add these lines to your `.env` file:

```env
# SMTP Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password
SMTP_FROM=your-email@gmail.com
```

Replace:
- `your-email@gmail.com` with your Gmail address
- `your-16-character-app-password` with the app password from Step 1

## Option 2: Other Email Providers

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
SMTP_FROM=your-email@outlook.com
```

### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@yahoo.com
```

### Custom SMTP Server
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@yourdomain.com
```

## Option 3: Transactional Email Services (Recommended for Production)

### SendGrid
1. Sign up at https://sendgrid.com/
2. Create an API key
3. Use these settings:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
```

### Mailgun
1. Sign up at https://www.mailgun.com/
2. Get your SMTP credentials
3. Use these settings:
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
SMTP_FROM=noreply@yourdomain.com
```

## Testing

1. Add the SMTP configuration to your `.env` file
2. Restart your development server: `npm run dev`
3. Go to `/forgot-password`
4. Enter a valid email address
5. Check the email inbox for the password reset link

## Troubleshooting

### "Authentication failed" error
- **Gmail**: Make sure you're using an App Password, not your regular password
- **Other providers**: Check your credentials are correct

### "Connection timeout" error
- Check your firewall isn't blocking port 587 or 465
- Verify SMTP_HOST and SMTP_PORT are correct

### Emails going to spam
- Use a transactional email service (SendGrid, Mailgun) for production
- Set up SPF and DKIM records for your domain
- Use a proper "from" address

## Security Notes

- Never commit your `.env` file to version control
- Use App Passwords for Gmail (not your main password)
- For production, use a dedicated email service (SendGrid, Mailgun, etc.)
- Consider rate limiting password reset requests

## Free Tier Limits

- **Gmail**: 500 emails/day (personal accounts)
- **SendGrid**: 100 emails/day (free tier)
- **Mailgun**: 5,000 emails/month (free tier)

For production, consider upgrading to a paid plan for better reliability and higher limits.

