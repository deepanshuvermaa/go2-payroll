import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export class LnDService {
  // ── Trainings ───────────────────────────────────────────────────────────────

  async getTrainings(orgId: string) {
    const trainings = await prisma.training.findMany({
      where: { orgId },
      include: {
        _count: { select: { enrollments: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    return trainings.map((t) => ({
      ...t,
      enrollmentsCount: t._count.enrollments,
    }));
  }

  async enrollTraining(trainingId: string, employeeId: string) {
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: { _count: { select: { enrollments: true } } },
    });
    if (!training) throw new AppError(404, 'Training not found');

    if (training._count.enrollments >= training.maxSeats) {
      throw new AppError(409, 'Training is fully booked');
    }

    const existing = await prisma.trainingEnrollment.findUnique({
      where: { trainingId_employeeId: { trainingId, employeeId } },
    });
    if (existing) throw new AppError(409, 'Already enrolled in this training');

    return prisma.trainingEnrollment.create({
      data: { trainingId, employeeId, status: 'ENROLLED' },
      include: { training: true },
    });
  }

  async completeTraining(trainingId: string, employeeId: string) {
    const enrollment = await prisma.trainingEnrollment.findUnique({
      where: { trainingId_employeeId: { trainingId, employeeId } },
    });
    if (!enrollment) throw new AppError(404, 'Enrollment not found');
    if (enrollment.status === 'COMPLETED') {
      throw new AppError(409, 'Training already marked as completed');
    }

    return prisma.trainingEnrollment.update({
      where: { trainingId_employeeId: { trainingId, employeeId } },
      data: { status: 'COMPLETED', completedAt: new Date() },
      include: { training: true },
    });
  }

  async getMyTrainings(employeeId: string) {
    return prisma.trainingEnrollment.findMany({
      where: { employeeId },
      include: { training: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Assessments ─────────────────────────────────────────────────────────────

  async getAssessments(orgId: string) {
    return prisma.skillAssessment.findMany({
      where: { orgId },
      include: { _count: { select: { attempts: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async startAssessment(assessmentId: string, employeeId: string) {
    const assessment = await prisma.skillAssessment.findUnique({
      where: { id: assessmentId },
    });
    if (!assessment) throw new AppError(404, 'Assessment not found');

    // Allow multiple attempts; only block if one is currently in progress
    const inProgress = await prisma.assessmentAttempt.findFirst({
      where: { assessmentId, employeeId, completedAt: null },
    });
    if (inProgress) {
      throw new AppError(409, 'You already have an in-progress attempt for this assessment');
    }

    return prisma.assessmentAttempt.create({
      data: { assessmentId, employeeId },
      include: { assessment: true },
    });
  }

  async submitAssessment(attemptId: string, answers: object, score: number) {
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: { assessment: true },
    });
    if (!attempt) throw new AppError(404, 'Attempt not found');
    if (attempt.completedAt) throw new AppError(409, 'Attempt already submitted');

    const passed = score >= attempt.assessment.passingScore;

    return prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: { answers, score, passed, completedAt: new Date() },
      include: { assessment: true },
    });
  }

  // ── Certificates ─────────────────────────────────────────────────────────────

  async getMyCertificates(employeeId: string) {
    const now = new Date();
    const certs = await prisma.certificate.findMany({
      where: { employeeId },
      orderBy: { issuedDate: 'desc' },
    });

    return certs.map((c) => ({
      ...c,
      isExpired: c.expiryDate ? c.expiryDate < now : false,
      daysUntilExpiry: c.expiryDate
        ? Math.ceil((c.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null,
    }));
  }

  async addCertificate(
    employeeId: string,
    orgId: string,
    data: {
      title: string;
      issuedBy?: string;
      issuedDate: string;
      expiryDate?: string;
      fileUrl?: string;
    },
  ) {
    return prisma.certificate.create({
      data: {
        employeeId,
        orgId,
        title: data.title,
        issuedBy: data.issuedBy,
        issuedDate: new Date(data.issuedDate),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        fileUrl: data.fileUrl,
      },
    });
  }

  async getExpiringCertificates(orgId: string, days: number = 30) {
    const now = new Date();
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const certs = await prisma.certificate.findMany({
      where: {
        orgId,
        expiryDate: {
          gte: now,
          lte: cutoff,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: true,
          },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    return certs.map((c) => ({
      ...c,
      daysUntilExpiry: Math.ceil(
        (c.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      ),
    }));
  }
}

export const lndService = new LnDService();
