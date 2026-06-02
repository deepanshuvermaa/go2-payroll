import { Router } from 'express';
import { documentTemplateService, documentGenerationService } from './document.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// Templates
router.post('/templates', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await documentTemplateService.create(req.user.orgId, req.body);
  sendSuccess(res, result, 'Template created', 201);
}));
router.get('/templates', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await documentTemplateService.list(req.user.orgId);
  sendSuccess(res, result);
}));
router.post('/templates/:id/preview', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await documentTemplateService.preview(req.params.id, req.body);
  sendSuccess(res, result);
}));

// Generation
router.post('/generate', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await documentGenerationService.generate(req.body.employeeId, req.body.templateId, req.body.variables);
  sendSuccess(res, result);
}));
router.get('/employee/:id', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await documentGenerationService.getByEmployee(req.params.id);
  sendSuccess(res, result);
}));
router.post('/upload', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await documentGenerationService.upload(req.body.employeeId, req.body.docType, req.body.name, req.body.fileUrl, req.body.expiryDate ? new Date(req.body.expiryDate) : undefined);
  sendSuccess(res, result, 'Document uploaded', 201);
}));
router.post('/:id/verify', authenticate, authorize('HR_MANAGER', 'ORG_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const result = await documentGenerationService.verify(req.params.id, req.user.userId);
  sendSuccess(res, result);
}));
router.get('/expiring', authenticate, authorize('HR_MANAGER', 'ORG_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const result = await documentGenerationService.checkExpiring(req.user.orgId, +(req.query.days || 30));
  sendSuccess(res, result);
}));

export default router;
