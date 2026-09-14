import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { EmbeddingService } from '@/lib/services/embedding-service';

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    const {
      memorySpaceId,
      memoryId,
      query,
      typeFilter, // PHOTO, VIDEO, MESSAGE, TIMELINE
      yearFilter,
      contributorFilter,
    } = await req.json();

    if (!query || (!memorySpaceId && !memoryId)) {
      return NextResponse.json({ error: 'Search query and Memory Space ID are required' }, { status: 400 });
    }

    const space = await prisma.memorySpace.findFirst({
      where: {
        OR: [{ id: memorySpaceId }, { memoryId: memoryId || memorySpaceId }],
      },
      include: {
        contributors: true,
        aiSettings: true,
      },
    });

    if (!space) {
      return NextResponse.json({ error: 'Memory Space not found' }, { status: 404 });
    }

    // Permission check
    let userRole = 'GUEST';
    if (currentUser) {
      if (space.ownerId === currentUser.id) {
        userRole = 'OWNER';
      } else if (space.contributors.some((c) => c.userId === currentUser.id)) {
        userRole = 'CONTRIBUTOR';
      }
    }

    if (space.privacy === 'PRIVATE' && userRole === 'GUEST') {
      return NextResponse.json({ error: 'Access denied to private space' }, { status: 403 });
    }

    // Perform vector semantic similarity search
    const vectorMatches = await EmbeddingService.findSimilarMemories(
      space.id,
      query,
      12,
      typeFilter || undefined
    );

    const matchIdSet = new Set(vectorMatches.map((v) => v.memoryId));

    // Fetch actual memory entities from database
    const [photos, videos, messages, timelineEvents] = await Promise.all([
      prisma.memoryPhoto.findMany({
        where: { memorySpaceId: space.id },
      }),
      prisma.memoryVideo.findMany({
        where: { memorySpaceId: space.id },
      }),
      prisma.memoryMessage.findMany({
        where: { memorySpaceId: space.id },
      }),
      prisma.timelineEvent.findMany({
        where: { memorySpaceId: space.id },
      }),
    ]);

    const qLower = query.toLowerCase();

    // Helper to evaluate item match
    const filterAndScore = (item: any, type: string, textToSearch: string, itemDate?: string | null) => {
      let isVectorMatch = matchIdSet.has(item.id);
      let isTextMatch = textToSearch.toLowerCase().includes(qLower);

      if (!isVectorMatch && !isTextMatch) return null;

      // Apply optional metadata filters
      if (yearFilter && itemDate && !itemDate.includes(yearFilter)) return null;
      if (contributorFilter && item.uploadedBy && !item.uploadedBy.toLowerCase().includes(contributorFilter.toLowerCase())) return null;

      let matchReason = isVectorMatch ? 'Matched semantically' : 'Matched by keyword';
      if (item.caption && item.caption.toLowerCase().includes(qLower)) matchReason = 'Matched by caption';
      if (item.message && item.message.toLowerCase().includes(qLower)) matchReason = 'Matched by message';

      return {
        ...item,
        type,
        matchReason,
      };
    };

    const matchedPhotos = photos
      .map((p) => filterAndScore(p, 'PHOTO', `${p.caption} ${p.location} ${p.date} ${p.uploadedBy}`, p.date))
      .filter(Boolean);

    const matchedVideos = videos
      .map((v) => filterAndScore(v, 'VIDEO', `${v.title} ${v.caption} ${v.date} ${v.uploadedBy}`, v.date))
      .filter(Boolean);

    const matchedMessages = messages
      .map((m) => filterAndScore(m, 'MESSAGE', `${m.authorName} ${m.title} ${m.message}`, new Date(m.createdAt).getFullYear().toString()))
      .filter(Boolean);

    const matchedTimeline = timelineEvents
      .map((t) => filterAndScore(t, 'TIMELINE', `${t.title} ${t.description} ${t.date}`, t.date))
      .filter(Boolean);

    return NextResponse.json({
      query,
      results: {
        photos: matchedPhotos,
        videos: matchedVideos,
        messages: matchedMessages,
        timeline: matchedTimeline,
      },
      totalCount: matchedPhotos.length + matchedVideos.length + matchedMessages.length + matchedTimeline.length,
      success: true,
    });
  } catch (error) {
    console.error('AI Search Error:', error);
    return NextResponse.json(
      { error: 'AI Search temporarily unavailable' },
      { status: 500 }
    );
  }
}
