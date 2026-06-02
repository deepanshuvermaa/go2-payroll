import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export class RecruitmentService {
  async createJobPosting(orgId: string, data: any) {
    return prisma.jobPosting.create({ data: { ...data, orgId } });
  }

  async publishJob(postingId: string) {
    return prisma.jobPosting.update({ where: { id: postingId }, data: { status: 'PUBLISHED', publishedAt: new Date() } });
  }

  async addCandidate(jobId: string, data: { name: string; email: string; phone?: string; resumeUrl?: string }) {
    return prisma.candidate.create({ data: { jobId, ...data } });
  }

  async moveStage(candidateId: string, newStage: any) {
    return prisma.candidate.update({ where: { id: candidateId }, data: { stage: newStage } });
  }

  async scheduleInterview(candidateId: string, round: number, interviewerId: string, scheduledAt: Date) {
    return prisma.interview.create({ data: { candidateId, round, interviewerId, scheduledAt } });
  }

  async submitFeedback(interviewId: string, rating: number, feedback: string) {
    return prisma.interview.update({ where: { id: interviewId }, data: { rating, feedback, status: 'COMPLETED' } });
  }

  async getHiringPipeline(orgId: string) {
    const postings = await prisma.jobPosting.findMany({ where: { orgId, status: { not: 'CLOSED' } }, include: { candidates: true } });
    return postings.map(p => ({
      ...p,
      pipeline: {
        applied: p.candidates.filter(c => c.stage === 'APPLIED').length,
        screening: p.candidates.filter(c => c.stage === 'SCREENING').length,
        interview: p.candidates.filter(c => ['INTERVIEW_1', 'INTERVIEW_2', 'HR_ROUND'].includes(c.stage)).length,
        offer: p.candidates.filter(c => c.stage === 'OFFER').length,
        accepted: p.candidates.filter(c => c.stage === 'ACCEPTED').length,
      },
    }));
  }

  async convertToEmployee(candidateId: string, orgId: string) {
    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId }, include: { job: true } });
    if (!candidate || candidate.stage !== 'ACCEPTED') throw new AppError(400, 'Candidate must be in ACCEPTED stage');

    return prisma.employee.create({
      data: {
        orgId, employeeCode: `EMP-${Date.now()}`, firstName: candidate.name.split(' ')[0], lastName: candidate.name.split(' ').slice(1).join(' ') || '',
        email: candidate.email, phone: candidate.phone, dateOfJoining: new Date(),
      },
    });
  }
}

export const recruitmentService = new RecruitmentService();
