import { NextResponse } from 'next/server';
import { User } from '@/models';
import dbConnect from '@/lib/db';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user by email
    const user = await User.findOne({ email });

    // Don't reveal if email exists or not for security
    // But we still need to check if it's a credentials user
    if (!user || user.provider === 'google') {
      // Return success message even if user doesn't exist (security best practice)
      return NextResponse.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token expires in 1 hour

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Generate reset URL
    const baseUrl = 'https://task-scheduler-01.vercel.app';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // Send email via Nodemailer (SMTP)
    try {
      // SMTP configuration from environment variables
      const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
      const smtpPort = parseInt(process.env.SMTP_PORT || '587');
      const smtpUser = process.env.SMTP_USER;
      const smtpPassword = process.env.SMTP_PASSWORD;
      const smtpFrom = process.env.SMTP_FROM || smtpUser;

      if (!smtpUser || !smtpPassword) {
        console.error('SMTP configuration missing. Please set SMTP_USER and SMTP_PASSWORD');
        // Fallback to development mode
        const isDevelopment = process.env.NODE_ENV === 'development';
        return NextResponse.json({
          message: isDevelopment
            ? `SMTP not configured. Password reset link: ${resetUrl} (Check console for token)`
            : 'If an account with that email exists, a password reset link has been sent.',
          ...(isDevelopment && { resetUrl, resetToken }),
        });
      }

      // Create transporter
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });

      // Prepare email content
      const userName = user.name || user.username || 'User';
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2563EB; color: #FFFFFF !important; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: 600; }
            .button:hover { background-color: #1D4ED8; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Reset Your Password</h2>
            <p>Hi ${userName},</p>
            <p>You requested to reset your password for your Plan-it account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button" style="color: #FFFFFF;">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2563EB;">${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <div class="footer">
              <p>Best regards,<br>The Plan-it Team</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const emailText = `
        Reset Your Password for Plan-it
        
        Hi ${userName},
        
        You requested to reset your password for your Plan-it account.
        
        Click the link below to reset your password:
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request this, please ignore this email.
        
        Best regards,
        The Plan-it Team
      `;

      // Send email
      const mailOptions = {
        from: `"Plan-it" <${smtpFrom}>`,
        to: email,
        subject: 'Reset Your Password for Plan-it',
        text: emailText,
        html: emailHtml,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully:', info.messageId);
    } catch (emailError: any) {
      console.error('Error sending email via SMTP:', emailError);
      // Don't fail the request if email fails, but log it
      // In development, still return the reset link
      const isDevelopment = process.env.NODE_ENV === 'development';
      if (isDevelopment) {
        console.log('Password reset link (fallback):', resetUrl);
        return NextResponse.json({
          message: `Email sending failed, but here's your reset link: ${resetUrl}`,
          resetUrl,
          resetToken,
          emailError: emailError.message,
        });
      }
    }

    // Return success message
    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Error in forgot password:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

