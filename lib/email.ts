import { render } from '@react-email/render';
import nodemailer from 'nodemailer';
import { VerificationEmail } from '@/emails/VerificationEmail';
import { db } from '@/lib/db';
import { activationTokens } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';


// Create SMTP transporter
function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.qq.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });
}

export interface SendVerificationEmailParams {
  to: string;
  token: string;
}

export interface SendVerificationEmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Send verification email using SMTP (QQ/163/Gmail etc.)
 * In development mode without SMTP config, returns the token for testing
 */
export async function sendVerificationEmail({
  to,
  token,
}: SendVerificationEmailParams): Promise<SendVerificationEmailResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9000';
  const verificationUrl = `${appUrl}/verify-email?token=${token}`;
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@freepic.app';
  const expiresInMinutes = 30;

  // Development mode: return token without sending email
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
    console.log('\n========================================');
    console.log('📧 [DEV MODE] Verification Email');
    console.log('========================================');
    console.log('To:', to);
    console.log('Verification URL:', verificationUrl);
    console.log('Token:', token);
    console.log('========================================\n');

    return {
      success: true,
      messageId: 'dev-mode',
    };
  }

  // Check SMTP configuration
  const transporter = createTransporter();
  if (!transporter) {
    console.error('SMTP is not configured. Set SMTP_USER and SMTP_PASS in .env.local');
    return {
      success: false,
      error: '邮件服务未配置',
    };
  }

  try {
    // Render email template
    const html = await render(
      VerificationEmail({
        verificationUrl,
        email: to,
        expiresInMinutes,
      })
    );

    // Send email
    const info = await transporter.sendMail({
      from: {
        name: 'FreePic',
        address: fromEmail,
      },
      to,
      subject: '验证您的邮箱 - FreePic',
      html,
    });

    console.log(`Verification email sent to ${to}, messageId: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Failed to send verification email:', error);

    let errorMessage = '发送邮件失败';
    if (error instanceof Error) {
      // Handle common SMTP errors
      if (error.message.includes('Invalid login')) {
        errorMessage = '邮箱授权码错误，请检查配置';
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = '无法连接邮件服务器';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Generate a secure random token for email verification
 * Returns a 64-character hex string (32 bytes)
 */
export function generateVerificationToken(): string {
  // Generate random bytes using Web Crypto API
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a token using SHA-256 for secure storage
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}


export interface SendActivationEmailParams {
  to: string;
  userId: string;
}

export interface SendActivationEmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
  activationUrl?: string;
}

/**
 * Send account activation email
 * Creates a token and sends activation link to user
 */
export async function sendActivationEmail({
  to,
  userId,
}: SendActivationEmailParams): Promise<SendActivationEmailResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9000';
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@freepic.app';
  const expiresInMinutes = 60 * 24; // 24 hours

  // Generate activation token
  const token = generateVerificationToken();
  const activationUrl = `${appUrl}/api/auth/activate?token=${token}&userId=${userId}`;

  // Store token in database
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  await db.insert(activationTokens).values({
    id: uuidv4(),
    userId,
    token,
    expiresAt,
  });

  // Development mode: return token without sending email
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
    console.log('\n========================================');
    console.log('📧 [DEV MODE] Account Activation Email');
    console.log('========================================');
    console.log('To:', to);
    console.log('Activation URL:', activationUrl);
    console.log('Token:', token);
    console.log('========================================\n');

    return {
      success: true,
      messageId: 'dev-mode',
      activationUrl,
    };
  }

  // Check SMTP configuration
  const transporter = createTransporter();
  if (!transporter) {
    console.error('SMTP is not configured. Set SMTP_USER and SMTP_PASS in .env.local');
    return {
      success: false,
      error: '邮件服务未配置',
    };
  }

  try {
    // Simple HTML email for activation
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>激活您的 FreePic 账号</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 40px 20px;">
          <tr>
            <td>
              <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 700; margin: 0 0 20px; padding: 0; text-align: left;">激活您的账号</h1>
              
              <p style="color: #374151; font-size: 16px; line-height: 24px; text-align: left; margin: 16px 0;">您好，</p>
              
              <p style="color: #374151; font-size: 16px; line-height: 24px; text-align: left; margin: 16px 0;">
                感谢您注册 FreePic！请点击下方按钮激活您的账号 <strong>${to}</strong>。此链接将在 <strong>24 小时</strong>后失效。
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 24px; text-align: left; margin: 16px 0;">
                <strong>注意：</strong>账号激活后才能上传图片和下载图片。
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 24px 0;">
                    <a href="${activationUrl}" style="background-color: #4f46e5; border-radius: 6px; color: #fff; font-size: 16px; font-weight: 600; text-decoration: none; text-align: center; display: inline-block; padding: 12px 24px;">
                      激活账号
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #374151; font-size: 16px; line-height: 24px; text-align: left; margin: 16px 0;">如果按钮无法点击，请复制以下链接到浏览器地址栏：</p>

              <p style="color: #6b7280; font-size: 14px; line-height: 20px; text-align: left; margin: 12px 0; word-break: break-all; background-color: #f3f4f6; padding: 12px; border-radius: 4px;">${activationUrl}</p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

              <p style="color: #9ca3af; font-size: 12px; line-height: 20px; text-align: left; margin: 8px 0;">如果您没有注册 FreePic，请忽略此邮件。</p>

              <p style="color: #9ca3af; font-size: 12px; line-height: 20px; text-align: left; margin: 8px 0;">© ${new Date().getFullYear()} FreePic. 无版权图片库.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send email
    const info = await transporter.sendMail({
      from: {
        name: 'FreePic',
        address: fromEmail,
      },
      to,
      subject: '激活您的 FreePic 账号',
      html,
    });

    console.log(`Activation email sent to ${to}, messageId: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      activationUrl,
    };
  } catch (error) {
    console.error('Failed to send activation email:', error);

    let errorMessage = '发送邮件失败';
    if (error instanceof Error) {
      if (error.message.includes('Invalid login')) {
        errorMessage = '邮箱授权码错误，请检查配置';
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = '无法连接邮件服务器';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
