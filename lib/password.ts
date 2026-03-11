import bcrypt from 'bcryptjs';

/**
 * Hash a password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain text password with a hashed password
 * @param password Plain text password
 * @param hashedPassword Hashed password from database
 * @returns Boolean indicating if passwords match
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Validate password strength
 * @param password Password to validate
 * @returns Object with isValid and message
 */
export function validatePassword(password: string): {
  isValid: boolean;
  message: string;
} {
  if (password.length < 8) {
    return {
      isValid: false,
      message: '密码至少需要8个字符',
    };
  }

  if (!/[a-zA-Z]/.test(password)) {
    return {
      isValid: false,
      message: '密码需要包含至少一个字母',
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: '密码需要包含至少一个数字',
    };
  }

  return {
    isValid: true,
    message: '密码强度符合要求',
  };
}
