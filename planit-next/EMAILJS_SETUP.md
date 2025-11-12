# EmailJS Setup Guide

This guide will help you set up EmailJS for sending password reset emails.

## Step 1: Create an EmailJS Account

1. Visit [EmailJS](https://www.emailjs.com/) and create a free account
2. Log in to your EmailJS dashboard

## Step 2: Connect an Email Service

1. Go to **Email Services** in your EmailJS dashboard
2. Click **Add New Service**
3. Choose an email provider (Gmail, Outlook, SendGrid, etc.)
4. Follow the instructions to connect your email service
5. Note your **Service ID** (you'll need this later)

## Step 3: Create an Email Template

1. Go to **Email Templates** in your EmailJS dashboard
2. Click **Create New Template**
3. Design your password reset email template
4. Use these variables in your template:
   - `{{to_name}}` - Recipient's name
   - `{{to_email}}` - Recipient's email
   - `{{reset_url}}` - Password reset link
   - `{{app_name}}` - Application name (Plan-it)

### Example Template:

```
Subject: Reset Your Password for {{app_name}}

Hi {{to_name}},

You requested to reset your password for your {{app_name}} account.

Click the link below to reset your password:
{{reset_url}}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

Best regards,
The {{app_name}} Team
```

5. Save the template and note your **Template ID**

## Step 4: Get Your API Keys

1. Go to **Account** → **General** in your EmailJS dashboard
2. Find your **Public Key** (also called API Key)
3. For server-side usage, you may also need a **Private Key** (if available)

## Step 5: Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# EmailJS Configuration
EMAILJS_SERVICE_ID=your_service_id_here
EMAILJS_TEMPLATE_ID=your_template_id_here
EMAILJS_PUBLIC_KEY=your_public_key_here
EMAILJS_PRIVATE_KEY=your_private_key_here  # Optional, for server-side usage

# Application URL (for reset links)
NEXTAUTH_URL=http://localhost:3000  # Change to your production URL in production
# OR
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 6: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to `/forgot-password`
3. Enter a valid email address
4. Check your email inbox for the password reset link

## Troubleshooting

### Email not sending?

1. **Check environment variables**: Make sure all EmailJS environment variables are set correctly
2. **Check console logs**: Look for error messages in your server console
3. **Verify template variables**: Ensure your template uses the correct variable names
4. **Check email service**: Verify your email service is properly connected in EmailJS dashboard
5. **Check quotas**: Free EmailJS accounts have monthly email limits

### Development Mode

If EmailJS is not configured, the system will fall back to development mode:
- In development, the reset link will be shown in the API response
- Check your server console for the reset link and token

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your Private Key secure (if using one)
- Consider rate limiting password reset requests
- Monitor your EmailJS usage to prevent abuse

## Free Tier Limits

EmailJS free tier includes:
- 200 emails per month
- Basic email templates
- Standard support

For production use, consider upgrading to a paid plan for higher limits and better reliability.

