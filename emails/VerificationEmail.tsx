import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Preview,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface VerificationEmailProps {
  verificationUrl: string;
  email: string;
  expiresInMinutes: number;
}

export function VerificationEmail({
  verificationUrl,
  email,
  expiresInMinutes,
}: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>验证您的邮箱以完成登录 - FreePic</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>验证您的邮箱</Heading>

          <Text style={text}>您好，</Text>

          <Text style={text}>
            请点击下方按钮验证您的邮箱地址 <strong>{email}</strong> 并完成登录。 此链接将在{' '}
            <strong>{expiresInMinutes} 分钟</strong>后失效。
          </Text>

          <Button style={button} href={verificationUrl}>
            验证邮箱并登录
          </Button>

          <Text style={text}>如果按钮无法点击，请复制以下链接到浏览器地址栏：</Text>

          <Text style={link}>{verificationUrl}</Text>

          <Hr style={hr} />

          <Text style={footer}>如果您没有请求此验证，请忽略此邮件。您的邮箱不会被验证。</Text>

          <Text style={footer}>© {new Date().getFullYear()} FreePic. 无版权图片库.</Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '8px',
  maxWidth: '560px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '700' as const,
  margin: '0 0 20px',
  padding: '0',
  textAlign: 'left' as const,
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  margin: '16px 0',
};

const button = {
  backgroundColor: '#4f46e5',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '24px 0',
};

const link = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  textAlign: 'left' as const,
  margin: '12px 0',
  wordBreak: 'break-all' as const,
  backgroundColor: '#f3f4f6',
  padding: '12px',
  borderRadius: '4px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '20px',
  textAlign: 'left' as const,
  margin: '8px 0',
};

export default VerificationEmail;
