import prisma from '../../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { AppError } from '../../middleware/errorHandler';
import { AuthPayload } from '../../middleware/auth';
import { authenticator } from 'otplib';
import { v4 as uuid } from 'uuid';

export class AuthService {
  async register(data: { email: string; password: string; orgId?: string; role?: any; firstName: string; lastName: string; orgName?: string }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError(409, 'Email already registered');

    // Create org if not provided
    let orgId = data.orgId;
    if (!orgId) {
      const org = await prisma.organization.create({ data: { name: data.orgName || `${data.firstName}'s Organization`, email: data.email } });
      orgId = org.id;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { email: data.email, passwordHash, orgId, role: data.role || 'ORG_ADMIN' },
    });

    const employee = await prisma.employee.create({
      data: {
        orgId,
        userId: user.id,
        employeeCode: `EMP-${Date.now()}`,
        firstName: data.firstName,
        lastName: data.lastName || '',
        email: data.email,
        dateOfJoining: new Date(),
      },
    });

    const tokens = this.generateTokens({ userId: user.id, orgId: orgId!, role: user.role, employeeId: employee.id });
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return { user: { id: user.id, email: user.email, role: user.role, orgId }, employee, ...tokens };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email }, include: { employee: true } });
    if (!user || !user.isActive) throw new AppError(401, 'Invalid credentials');
    if (user.lockedUntil && user.lockedUntil > new Date()) throw new AppError(423, 'Account locked. Try later.');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const attempts = user.failedAttempts + 1;
      const update: any = { failedAttempts: attempts };
      if (attempts >= 5) update.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      await prisma.user.update({ where: { id: user.id }, data: update });
      throw new AppError(401, 'Invalid credentials');
    }

    if (user.mfaEnabled) return { requiresMfa: true, userId: user.id };

    await prisma.user.update({ where: { id: user.id }, data: { failedAttempts: 0, lastLogin: new Date(), lockedUntil: null } });
    const tokens = this.generateTokens({ userId: user.id, orgId: user.orgId, role: user.role, employeeId: user.employee?.id });
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return { user: { id: user.id, email: user.email, role: user.role, orgId: user.orgId }, ...tokens };
  }

  async verifyMfa(userId: string, otp: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { employee: true } });
    if (!user || !user.mfaSecret) throw new AppError(400, 'MFA not configured');
    if (!authenticator.verify({ token: otp, secret: user.mfaSecret })) throw new AppError(401, 'Invalid OTP');

    await prisma.user.update({ where: { id: user.id }, data: { failedAttempts: 0, lastLogin: new Date() } });
    const tokens = this.generateTokens({ userId: user.id, orgId: user.orgId, role: user.role, employeeId: user.employee?.id });
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return { user: { id: user.id, email: user.email, role: user.role }, ...tokens };
  }

  async enableMfa(userId: string) {
    const secret = authenticator.generateSecret();
    await prisma.user.update({ where: { id: userId }, data: { mfaSecret: secret, mfaEnabled: true } });
    const otpauth = authenticator.keyuri(userId, 'Go2-Payroll', secret);
    return { secret, otpauth };
  }

  async disableMfa(userId: string) {
    await prisma.user.update({ where: { id: userId }, data: { mfaSecret: null, mfaEnabled: false } });
  }

  async refreshToken(token: string) {
    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) throw new AppError(401, 'Invalid refresh token');

    const user = await prisma.user.findUnique({ where: { id: stored.userId }, include: { employee: true } });
    if (!user) throw new AppError(401, 'User not found');

    await prisma.refreshToken.delete({ where: { id: stored.id } });
    const tokens = this.generateTokens({ userId: user.id, orgId: user.orgId, role: user.role, employeeId: user.employee?.id });
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(token: string) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, 'User not found');
    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) throw new AppError(401, 'Current password incorrect');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  private generateTokens(payload: AuthPayload) {
    const token = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn as any });
    const refreshToken = uuid();
    return { token, refreshToken };
  }

  private async saveRefreshToken(userId: string, token: string) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({ data: { userId, token, expiresAt } });
  }
}

export const authService = new AuthService();
