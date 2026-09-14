import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    const { memorySpaceId, memoryId } = await req.json();

    const targetSpaceId = memorySpaceId || memoryId;
    if (!targetSpaceId) {
      return NextResponse.json({ error: 'Memory Space ID is required' }, { status: 400 });
    }

    const space = await prisma.memorySpace.findFirst({
      where: {
        OR: [{ id: targetSpaceId }, { memoryId: targetSpaceId }],
      },
      include: {
        photos: { orderBy: { date: 'asc' } },
        videos: { orderBy: { date: 'asc' } },
        messages: { orderBy: { createdAt: 'asc' } },
        timelineEvents: { orderBy: { date: 'asc' } },
      },
    });

    if (!space) {
      return NextResponse.json({ error: 'Memory space not found' }, { status: 404 });
    }

    // Group memories by year
    const timelineByYear: Record<string, { year: string; title: string; summary: string; memories: any[] }> = {};

    // Helper to add to year bucket
    const addToYear = (yearStr: string, itemTitle: string, memoryItem: any) => {
      const year = yearStr.slice(0, 4);
      if (!timelineByYear[year]) {
        timelineByYear[year] = {
          year,
          title: `Milestones in ${year}`,
          summary: `Key events and memories recorded during ${year}.`,
          memories: [],
        };
      }
      timelineByYear[year].memories.push({ title: itemTitle, ...memoryItem });
    };

    if (space.firstMeetingDate) {
      addToYear(space.firstMeetingDate, 'First Meeting & Initial Bond', { type: 'MILESTONE', date: space.firstMeetingDate });
    }

    for (const evt of space.timelineEvents) {
      if (evt.date) addToYear(evt.date, evt.title, { type: 'TIMELINE', ...evt });
    }

    for (const photo of space.photos) {
      if (photo.date) addToYear(photo.date, photo.caption || 'Photo Memory', { type: 'PHOTO', ...photo });
    }

    for (const vid of space.videos) {
      if (vid.date) addToYear(vid.date, vid.title || 'Video Memory', { type: 'VIDEO', ...vid });
    }

    const compiledTimeline = Object.values(timelineByYear).sort((a, b) => a.year.localeCompare(b.year));

    return NextResponse.json({
      personName: space.personName,
      timeline: compiledTimeline,
      success: true,
    });
  } catch (error) {
    console.error('AI Timeline Error:', error);
    return NextResponse.json({ error: 'Failed to build AI timeline' }, { status: 500 });
  }
}
