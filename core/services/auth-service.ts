import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../data/prisma/prisma';
import { User, UserRole } from '@prisma/client';
import { NextRequest } from 'next/server';

export interface SignUpData {
  email: string;
  password: string;
  name?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  private readonly JWT_EXPIRES_IN = '7d';
  private readonly SALT_ROUNDS = 12;

  /**
   * Hash a password
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify a password
   */
  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generate JWT token
   */
  private generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  /**
   * Verify JWT token
   */
  private verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.JWT_SECRET) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  private isValidPassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/(?=.*\d)/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    return { valid: true };
  }

  /**
   * Sign up a new user
   */
  async signUp(data: SignUpData): Promise<AuthResult> {
    try {
      // Validate input
      if (!this.isValidEmail(data.email)) {
        return { success: false, error: 'Invalid email format' };
      }

      const passwordValidation = this.isValidPassword(data.password);
      if (!passwordValidation.valid) {
        return { success: false, error: passwordValidation.message };
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      if (existingUser) {
        return { success: false, error: 'User with this email already exists' };
      }

      // Hash password
      const hashedPassword = await this.hashPassword(data.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          name: data.name,
          password: hashedPassword,
          isVerified: true, // For now, skip email verification
        },
      });

      // Generate token
      const token = this.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      return {
        success: true,
        user: { ...user, password: undefined } as any, // Remove password from response
        token,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'Failed to create account' };
    }
  }

  /**
   * Sign in a user
   */
  async signIn(data: SignInData): Promise<AuthResult> {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      if (!user) {
        return { success: false, error: 'Invalid email or password' };
      }

      if (!user.isActive) {
        return { success: false, error: 'Account is deactivated' };
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(data.password, user.password);
      if (!isValidPassword) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Generate token
      const token = this.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      return {
        success: true,
        user: { ...user, password: undefined } as any, // Remove password from response
        token,
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'Failed to sign in' };
    }
  }

  /**
   * Get user from JWT token
   */
  async getUserFromToken(token: string): Promise<User | null> {
    try {
      const payload = this.verifyToken(token);
      if (!payload) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || !user.isActive) {
        return null;
      }

      return { ...user, password: undefined } as any; // Remove password from response
    } catch (error) {
      console.error('Get user from token error:', error);
      return null;
    }
  }

  /**
   * Get user from request (Authorization header or cookie)
   */
  async getUserFromRequest(req: NextRequest): Promise<User | null> {
    try {
      // Try Authorization header first
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        return this.getUserFromToken(token);
      }

      // Try cookie
      const tokenCookie = req.cookies.get('auth-token');
      if (tokenCookie) {
        return this.getUserFromToken(tokenCookie.value);
      }

      return null;
    } catch (error) {
      console.error('Get user from request error:', error);
      return null;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Verify current password
      const isValidCurrentPassword = await this.verifyPassword(currentPassword, user.password);
      if (!isValidCurrentPassword) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Validate new password
      const passwordValidation = this.isValidPassword(newPassword);
      if (!passwordValidation.valid) {
        return { success: false, error: passwordValidation.message };
      }

      // Hash new password
      const hashedNewPassword = await this.hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: 'Failed to change password' };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: { name?: string; email?: string }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Validate email if provided
      if (data.email && !this.isValidEmail(data.email)) {
        return { success: false, error: 'Invalid email format' };
      }

      // Check if email is already taken (if changing email)
      if (data.email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email: data.email.toLowerCase(),
            NOT: { id: userId },
          },
        });

        if (existingUser) {
          return { success: false, error: 'Email is already taken' };
        }
      }

      // Update user
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.email && { email: data.email.toLowerCase() }),
        },
      });

      return {
        success: true,
        user: { ...user, password: undefined } as any, // Remove password from response
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
