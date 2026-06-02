import { Router } from 'express';
import { authService } from './auth.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/register', asyncHandler(async (req: any, res: any) => {
  const result = await authService.register(req.body);
  sendSuccess(res, result, 'Registration successful', 201);
}));

router.post('/login', asyncHandler(async (req: any, res: any) => {
  const result = await authService.login(req.body.email, req.body.password);
  sendSuccess(res, result, 'Login successful');
}));

router.post('/verify-mfa', asyncHandler(async (req: any, res: any) => {
  const result = await authService.verifyMfa(req.body.userId, req.body.otp);
  sendSuccess(res, result, 'MFA verified');
}));

router.post('/refresh', asyncHandler(async (req: any, res: any) => {
  const result = await authService.refreshToken(req.body.refreshToken);
  sendSuccess(res, result, 'Token refreshed');
}));

router.post('/logout', authenticate, asyncHandler(async (req: any, res: any) => {
  await authService.logout(req.body.refreshToken);
  sendSuccess(res, null, 'Logged out');
}));

router.post('/change-password', authenticate, asyncHandler(async (req: any, res: any) => {
  await authService.changePassword(req.user!.userId, req.body.oldPassword, req.body.newPassword);
  sendSuccess(res, null, 'Password changed');
}));

router.post('/enable-mfa', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await authService.enableMfa(req.user!.userId);
  sendSuccess(res, result, 'MFA enabled');
}));

router.post('/disable-mfa', authenticate, asyncHandler(async (req: any, res: any) => {
  await authService.disableMfa(req.user!.userId);
  sendSuccess(res, null, 'MFA disabled');
}));

export default router;
