import prisma from '../../config/database';

// ─── helpers ────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

/**
 * Find or create a Survey for this org with the given title.
 * The record is kept active and stores an empty questions array.
 */
async function findOrCreateSurvey(orgId: string, title: string): Promise<string> {
  const existing = await prisma.survey.findFirst({
    where: { orgId, title },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.survey.create({
    data: {
      orgId,
      title,
      questions: [],
      isAnonymous: true,
      isActive: true,
      publishedAt: new Date(),
    },
    select: { id: true },
  });
  return created.id;
}

// ─── pulse ──────────────────────────────────────────────────────────────────

export async function submitPulse(
  orgId: string,
  employeeId: string,
  mood: number,
  energy: number,
  productivity: number,
): Promise<object> {
  try {
    const surveyId = await findOrCreateSurvey(orgId, 'Daily Pulse');
    const date = todayISO();

    // Delete any existing response for this employee/date so we only keep one
    await prisma.surveyResponse.deleteMany({
      where: {
        surveyId,
        employeeId,
        answers: { path: ['date'], equals: date },
      },
    });

    const response = await prisma.surveyResponse.create({
      data: {
        surveyId,
        employeeId,
        answers: { mood, energy, productivity, date },
      },
    });

    return response;
  } catch (err) {
    console.error('[submitPulse]', err);
    throw err;
  }
}

export async function getPulseTrend(
  orgId: string,
): Promise<Array<{ date: string; avgMood: number; avgEnergy: number; avgProductivity: number }>> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const surveys = await prisma.survey.findMany({
      where: { orgId, title: 'Daily Pulse' },
      select: { id: true },
    });
    if (!surveys.length) return [];

    const surveyIds = surveys.map((s) => s.id);

    const responses = await prisma.surveyResponse.findMany({
      where: {
        surveyId: { in: surveyIds },
        createdAt: { gte: since },
      },
      select: { answers: true },
    });

    // Group by date
    const byDate: Record<string, { mood: number[]; energy: number[]; productivity: number[] }> = {};

    for (const r of responses) {
      const a = r.answers as Record<string, unknown>;
      const date = typeof a['date'] === 'string' ? a['date'] : '';
      if (!date) continue;

      if (!byDate[date]) byDate[date] = { mood: [], energy: [], productivity: [] };

      const mood = typeof a['mood'] === 'number' ? a['mood'] : 0;
      const energy = typeof a['energy'] === 'number' ? a['energy'] : 0;
      const productivity = typeof a['productivity'] === 'number' ? a['productivity'] : 0;

      byDate[date].mood.push(mood);
      byDate[date].energy.push(energy);
      byDate[date].productivity.push(productivity);
    }

    const avg = (arr: number[]) =>
      arr.length ? Math.round((arr.reduce((s, n) => s + n, 0) / arr.length) * 10) / 10 : 0;

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date,
        avgMood: avg(vals.mood),
        avgEnergy: avg(vals.energy),
        avgProductivity: avg(vals.productivity),
      }));
  } catch (err) {
    console.error('[getPulseTrend]', err);
    return [];
  }
}

// ─── kudos / recognition ────────────────────────────────────────────────────

export async function giveKudos(
  fromId: string,
  toId: string,
  badge: string,
  message: string,
  points: number,
): Promise<object> {
  try {
    return await prisma.recognition.create({
      data: { fromId, toId, badge, message, points },
    });
  } catch (err) {
    console.error('[giveKudos]', err);
    throw err;
  }
}

export async function getKudosFeed(orgId: string): Promise<
  Array<{
    id: string;
    from: { name: string };
    to: { name: string };
    badge: string;
    message: string | null;
    points: number;
    createdAt: Date;
  }>
> {
  try {
    const records = await prisma.recognition.findMany({
      where: {
        from: { orgId },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        from: { select: { firstName: true, lastName: true } },
        to: { select: { firstName: true, lastName: true } },
      },
    });

    return records.map((r) => ({
      id: r.id,
      from: { name: `${r.from.firstName} ${r.from.lastName}`.trim() },
      to: { name: `${r.to.firstName} ${r.to.lastName}`.trim() },
      badge: r.badge,
      message: r.message,
      points: r.points,
      createdAt: r.createdAt,
    }));
  } catch (err) {
    console.error('[getKudosFeed]', err);
    return [];
  }
}

// ─── leaderboard ─────────────────────────────────────────────────────────────

export async function getLeaderboard(orgId: string): Promise<
  Array<{
    rank: number;
    employeeId: string;
    name: string;
    designation: string;
    points: number;
    kudosCount: number;
  }>
> {
  try {
    // Fetch all recognitions for the org (via recipient's orgId)
    const records = await prisma.recognition.findMany({
      where: { to: { orgId } },
      select: {
        toId: true,
        points: true,
        to: {
          select: {
            firstName: true,
            lastName: true,
            designation: { select: { name: true } },
          },
        },
      },
    });

    // Aggregate per employee
    const map: Record<
      string,
      { employeeId: string; name: string; designation: string; points: number; kudosCount: number }
    > = {};

    for (const r of records) {
      if (!map[r.toId]) {
        map[r.toId] = {
          employeeId: r.toId,
          name: `${r.to.firstName} ${r.to.lastName}`.trim(),
          designation: r.to.designation?.name ?? '',
          points: 0,
          kudosCount: 0,
        };
      }
      map[r.toId].points += r.points;
      map[r.toId].kudosCount += 1;
    }

    return Object.values(map)
      .sort((a, b) => b.points - a.points || b.kudosCount - a.kudosCount)
      .slice(0, 10)
      .map((entry, idx) => ({ rank: idx + 1, ...entry }));
  } catch (err) {
    console.error('[getLeaderboard]', err);
    return [];
  }
}

// ─── eNPS ────────────────────────────────────────────────────────────────────

export async function getENPS(orgId: string): Promise<{
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
  responses: Array<{ score: number; comment: string; createdAt: Date }>;
}> {
  const empty = { score: 0, promoters: 0, passives: 0, detractors: 0, total: 0, responses: [] };

  try {
    const surveys = await prisma.survey.findMany({
      where: { orgId, title: 'eNPS' },
      select: { id: true },
    });
    if (!surveys.length) return empty;

    const surveyIds = surveys.map((s) => s.id);

    const responses = await prisma.surveyResponse.findMany({
      where: { surveyId: { in: surveyIds } },
      select: { answers: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!responses.length) return empty;

    let promoters = 0;
    let passives = 0;
    let detractors = 0;
    const formatted: Array<{ score: number; comment: string; createdAt: Date }> = [];

    for (const r of responses) {
      const a = r.answers as Record<string, unknown>;
      const s = typeof a['score'] === 'number' ? a['score'] : 0;
      const comment = typeof a['comment'] === 'string' ? a['comment'] : '';

      if (s >= 9) promoters++;
      else if (s >= 7) passives++;
      else detractors++;

      formatted.push({ score: s, comment, createdAt: r.createdAt });
    }

    const total = promoters + passives + detractors;
    const score = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;

    return { score, promoters, passives, detractors, total, responses: formatted };
  } catch (err) {
    console.error('[getENPS]', err);
    return empty;
  }
}

export async function submitENPS(
  orgId: string,
  employeeId: string,
  score: number,
  comment: string,
): Promise<object> {
  try {
    const surveyId = await findOrCreateSurvey(orgId, 'eNPS');

    return await prisma.surveyResponse.create({
      data: {
        surveyId,
        employeeId,
        answers: { score, comment },
      },
    });
  } catch (err) {
    console.error('[submitENPS]', err);
    throw err;
  }
}

// ─── mood heatmap ─────────────────────────────────────────────────────────────

/**
 * Returns a 12-week mood heatmap grid.
 * Each cell: { weekNumber, dayOfWeek (0=Sun…6=Sat), avgMood, count }
 */
export async function getMoodHeatmap(orgId: string): Promise<
  Array<{
    weekNumber: number;
    dayOfWeek: number;
    avgMood: number;
    count: number;
  }>
> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 84); // 12 weeks × 7 days

    const surveys = await prisma.survey.findMany({
      where: { orgId, title: 'Daily Pulse' },
      select: { id: true },
    });
    if (!surveys.length) return [];

    const surveyIds = surveys.map((s) => s.id);

    const responses = await prisma.surveyResponse.findMany({
      where: {
        surveyId: { in: surveyIds },
        createdAt: { gte: since },
      },
      select: { answers: true, createdAt: true },
    });

    // Group by (weekNumber, dayOfWeek)
    // weekNumber = 0 for the oldest week, 11 for the most recent
    const now = new Date();
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;

    const cellMap: Record<string, { moods: number[]; weekNumber: number; dayOfWeek: number }> = {};

    for (const r of responses) {
      const a = r.answers as Record<string, unknown>;
      const mood = typeof a['mood'] === 'number' ? a['mood'] : null;
      if (mood === null) continue;

      const d = r.createdAt;
      const dayOfWeek = d.getDay(); // 0 = Sunday
      const weeksAgo = Math.floor((now.getTime() - d.getTime()) / msPerWeek);
      const weekNumber = 11 - weeksAgo; // 0 = oldest, 11 = most recent

      if (weekNumber < 0 || weekNumber > 11) continue;

      const key = `${weekNumber}_${dayOfWeek}`;
      if (!cellMap[key]) cellMap[key] = { moods: [], weekNumber, dayOfWeek };
      cellMap[key].moods.push(mood);
    }

    return Object.values(cellMap).map(({ moods, weekNumber, dayOfWeek }) => ({
      weekNumber,
      dayOfWeek,
      avgMood:
        moods.length > 0
          ? Math.round((moods.reduce((s, n) => s + n, 0) / moods.length) * 10) / 10
          : 0,
      count: moods.length,
    }));
  } catch (err) {
    console.error('[getMoodHeatmap]', err);
    return [];
  }
}
