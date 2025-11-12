# Quick EmailJS Setup Guide

## Step 1: Get Your EmailJS Credentials

1. **Sign up/Login**: Go to https://www.emailjs.com/ and create an account (free tier available)

2. **Add Email Service**:
   - Go to https://dashboard.emailjs.com/admin/integration
   - Click "Add New Service"
   - Choose Gmail, Outlook, or any other service
   - Follow the connection steps
   - **Copy your Service ID** (e.g., `service_abc123`)

3. **Create Email Template**:
   - Go to https://dashboard.emailjs.com/admin/template
   - Click "Create New Template"
   - Use this template:

   ```
   Subject: Reset Your Password for Plan-it

   Hi {{to_name}},

   You requested to reset your password for your Plan-it account.

   Click the link below to reset your password:
   {{reset_url}}

   This link will expire in 1 hour.

   If you didn't request this, please ignore this email.

   Best regards,
   The Plan-it Team
   ```

   - **Copy your Template ID** (e.g., `template_xyz789`)

4. **Get Your Public Key**:
   - Go to https://dashboard.emailjs.com/admin/account
   - Find "Public Key" or "API Key"
   - **Copy your Public Key** (e.g., `abc123xyz`)

5. **Get Private Key (Optional)**:
   - In the same Account page, look for "Private Key"
   - This is optional but recommended for server-side usage

## Step 2: Add to Your .env File

Open your `.env` file in the `planit-next` folder and add these lines:

```env
EMAILJS_SERVICE_ID=your_service_id_here
EMAILJS_TEMPLATE_ID=your_template_id_here
EMAILJS_PUBLIC_KEY=your_public_key_here
EMAILJS_PRIVATE_KEY=your_private_key_here
```

Replace the values with your actual EmailJS credentials.

## Step 3: Restart Your Server

After adding the environment variables:
1. Stop your development server (Ctrl+C)
2. Start it again: `npm run dev`
3. Try the forgot password flow again

## Testing

1. Go to http://localhost:3000/forgot-password
2. Enter a valid email address
3. Check your email inbox for the password reset link

## Troubleshooting

- **Still seeing "EmailJS not configured"**: Make sure you restarted your server after adding the env variables
- **Email not sending**: Check the server console for error messages
- **Template variables not working**: Make sure your template uses `{{to_name}}`, `{{reset_url}}`, etc.

## Free Tier Limits

EmailJS free tier: 200 emails/month - perfect for development and small projects!

