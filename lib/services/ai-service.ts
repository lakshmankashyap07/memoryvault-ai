import { prisma } from '@/lib/db';
import { EmbeddingService, SimilarityResult } from './embedding-service';

export interface AISource {
  id: string;
  type: 'PHOTO' | 'VIDEO' | 'MESSAGE' | 'TIMELINE' | 'CONTACT';
  title: string;
  date?: string | null;
  snippet?: string;
  url?: string;
}

export interface AIChatResponse {
  answer: string;
  sources: AISource[];
  confidenceLabel: 'Based on your memories' | 'I found several related memories' | 'Weak evidence';
}

export interface AIServiceProvider {
  askMemories(memorySpaceId: string, question: string, userId: string): Promise<AIChatResponse>;
  analyzePhoto(photoUrl: string, caption?: string, location?: string): Promise<{ description: string; tags: string[] }>;
  analyzeVideo(title?: string, caption?: string): Promise<{ summary: string; tags: string[] }>;
  summarizeSpace(memorySpaceId: string): Promise<{ title: string; story: string; keyThemes: string[] }>;
  generateStory(memorySpaceId: string, length: 'SHORT' | 'MEDIUM' | 'LONG', selectedMemoryIds?: string[]): Promise<{ title: string; chapters: Array<{ chapterTitle: string; content: string; memoryReferences: string[] }> }>;
  suggestTags(memorySpaceId: string): Promise<string[]>;
}

export class GroundedLocalAIService implements AIServiceProvider {
  /**
   * Grounded RAG Chat Engine: Answers user questions strictly using stored memory records.
   */
  async askMemories(memorySpaceId: string, question: string, _userId: string): Promise<AIChatResponse> {
    const space = await prisma.memorySpace.findUnique({
      where: { id: memorySpaceId },
      include: {
        photos: true,
        videos: true,
        messages: true,
        timelineEvents: true,
        contributors: { include: { user: true } },
      },
    });

    if (!space) {
      return {
        answer: "I couldn't find that in this Memory Space.",
        sources: [],
        confidenceLabel: 'Weak evidence',
      };
    }

    const qLower = question.toLowerCase();
    const sources: AISource[] = [];
    const matchedSentences: string[] = [];

    // 1. Check timeline events
    for (const evt of space.timelineEvents) {
      const text = `${evt.title} ${evt.description || ''} ${evt.date}`.toLowerCase();
      if (this.isMatch(qLower, text)) {
        matchedSentences.push(`• On ${evt.date}, ${evt.title}: ${evt.description || ''}`);
        sources.push({
          id: evt.id,
          type: 'TIMELINE',
          title: evt.title,
          date: evt.date,
          snippet: evt.description || undefined,
        });
      }
    }

    // 2. Check memory notes & messages
    for (const msg of space.messages) {
      const text = `${msg.authorName} ${msg.title || ''} ${msg.message}`.toLowerCase();
      if (this.isMatch(qLower, text)) {
        matchedSentences.push(`• ${msg.authorName} wrote: "${msg.message}"`);
        sources.push({
          id: msg.id,
          type: 'MESSAGE',
          title: msg.title || `Note by ${msg.authorName}`,
          date: new Date(msg.createdAt).toLocaleDateString(),
          snippet: msg.message,
        });
      }
    }

    // 3. Check photo captions & locations
    for (const photo of space.photos) {
      const text = `${photo.caption || ''} ${photo.location || ''} ${photo.date || ''} ${photo.uploadedBy}`.toLowerCase();
      if (this.isMatch(qLower, text)) {
        matchedSentences.push(`• Photo (${photo.date || 'Undated'}): "${photo.caption || 'Photo memory'}" uploaded by ${photo.uploadedBy}`);
        sources.push({
          id: photo.id,
          type: 'PHOTO',
          title: photo.caption || `Photo by ${photo.uploadedBy}`,
          date: photo.date,
          url: photo.fileUrl,
        });
      }
    }

    // 4. Check video titles
    for (const vid of space.videos) {
      const text = `${vid.title || ''} ${vid.caption || ''} ${vid.date || ''} ${vid.uploadedBy}`.toLowerCase();
      if (this.isMatch(qLower, text)) {
        matchedSentences.push(`• Video "${vid.title || 'Video memory'}": ${vid.caption || ''}`);
        sources.push({
          id: vid.id,
          type: 'VIDEO',
          title: vid.title || 'Video Memory',
          date: vid.date,
          url: vid.fileUrl,
        });
      }
    }

    // 5. Special question intents (first meeting, college, summary, contributors)
    if (qLower.includes('first meet') || qLower.includes('first time') || qLower.includes('how did we meet')) {
      if (space.firstMeetingDate) {
        matchedSentences.push(`• First meeting date recorded: ${space.firstMeetingDate}`);
      }
    }

    if (qLower.includes('summarize') || qLower.includes('summary') || qLower.includes('who is')) {
      matchedSentences.push(`• Memory space for ${space.personName} (${space.relationship}). Description: "${space.description || 'Digital scrapbook space'}"`);
    }

    if (qLower.includes('contributor') || qLower.includes('who wrote') || qLower.includes('who added')) {
      const contributorNames = space.contributors.map((c) => c.user.name).join(', ');
      if (contributorNames) {
        matchedSentences.push(`• Contributors: ${contributorNames}`);
      }
    }

    // Vector semantic search fallback if direct match count is low
    if (sources.length === 0) {
      const vectorMatches = await EmbeddingService.findSimilarMemories(space.id, question, 3);
      for (const vm of vectorMatches) {
        if (vm.similarity > 0.15) {
          matchedSentences.push(`• ${vm.content}`);
          sources.push({
            id: vm.memoryId,
            type: vm.memoryType as any,
            title: vm.content.substring(0, 40) + '...',
          });
        }
      }
    }

    if (sources.length === 0 && matchedSentences.length === 0) {
      return {
        answer: "I couldn't find that in this Memory Space.",
        sources: [],
        confidenceLabel: 'Weak evidence',
      };
    }

    const uniqueSources = Array.from(new Map(sources.map((item) => [item.id, item])).values());
    const answer = matchedSentences.slice(0, 5).join('\n');

    return {
      answer: `Based on your memories for ${space.personName}:\n\n${answer}`,
      sources: uniqueSources,
      confidenceLabel: uniqueSources.length > 2 ? 'Based on your memories' : 'I found several related memories',
    };
  }

  private isMatch(query: string, targetText: string): boolean {
    const queryTokens = query.split(/\s+/).filter((w) => w.length > 2 && !['show', 'find', 'what', 'when', 'where', 'tell', 'about', 'from', 'with', 'have', 'were'].includes(w));
    if (queryTokens.length === 0) return false;
    return queryTokens.some((token) => targetText.includes(token));
  }

  async analyzePhoto(photoUrl: string, caption?: string, location?: string): Promise<{ description: string; tags: string[] }> {
    const desc = caption
      ? `A photo capturing: "${caption}"${location ? ` at ${location}` : ''}.`
      : `A preserved photo memory${location ? ` taken at ${location}` : ''}.`;

    const tags = ['Friendship', 'Memories'];
    if (location) tags.push('Travel', 'Location');
    if (caption?.toLowerCase().includes('fest') || caption?.toLowerCase().includes('party')) tags.push('Celebration');

    return { description: desc, tags };
  }

  async analyzeVideo(title?: string, caption?: string): Promise<{ summary: string; tags: string[] }> {
    const summary = title || caption
      ? `Video clip: "${title || caption}". Shared moments and laughter recorded.`
      : 'A video recording preserved in the memory vault.';

    return { summary, tags: ['Video', 'Celebration', 'Friendship'] };
  }

  async summarizeSpace(memorySpaceId: string): Promise<{ title: string; story: string; keyThemes: string[] }> {
    const space = await prisma.memorySpace.findUnique({
      where: { id: memorySpaceId },
      include: {
        photos: true,
        videos: true,
        messages: true,
        timelineEvents: true,
      },
    });

    if (!space) {
      return {
        title: 'Memory Vault Summary',
        story: 'No memory data available to summarize.',
        keyThemes: [],
      };
    }

    const story = `From your first recorded moments in ${space.firstMeetingDate || 'early days'} to your latest shared milestones, this collection preserves ${space.photos.length} photos, ${space.videos.length} videos, ${space.messages.length} notes, and ${space.timelineEvents.length} chronological milestones. A timeless testimony to your ${space.relationship} with ${space.personName}.`;

    return {
      title: `${space.personName} — Memory Story`,
      story,
      keyThemes: ['Friendship', 'Shared Milestones', 'Unbreakable Bond', 'College & Journeys'],
    };
  }

  async generateStory(
    memorySpaceId: string,
    length: 'SHORT' | 'MEDIUM' | 'LONG',
    _selectedMemoryIds?: string[]
  ): Promise<{ title: string; chapters: Array<{ chapterTitle: string; content: string; memoryReferences: string[] }> }> {
    const space = await prisma.memorySpace.findUnique({
      where: { id: memorySpaceId },
      include: {
        photos: true,
        videos: true,
        messages: true,
        timelineEvents: { orderBy: { date: 'asc' } },
      },
    });

    if (!space) {
      return { title: 'Our Story', chapters: [] };
    }

    const chapters = [
      {
        chapterTitle: 'Chapter 1 — The Beginning',
        content: space.firstMeetingDate
          ? `Our journey with ${space.personName} began on ${space.firstMeetingDate}. Roommates, classmates, and friends who quickly became family.`
          : `The initial chapters with ${space.personName} were marked by spontaneous plans, canteen chai, and late night conversations.`,
        memoryReferences: space.timelineEvents.slice(0, 1).map((e) => e.title),
      },
      {
        chapterTitle: 'Chapter 2 — Adventures & Unforgettable Moments',
        content: `Through ${space.photos.length} shared photos and ${space.messages.length} memory notes, we captured hackathons, road trips, festival jams, and everyday laughter.`,
        memoryReferences: space.photos.slice(0, 2).map((p) => p.caption || 'Photo Memory'),
      },
      {
        chapterTitle: 'Chapter 3 — Looking Forward',
        content: `Though time moves forward and places change, "Some people leave the place, never the memories." These preserved moments remain alive forever.`,
        memoryReferences: space.messages.slice(0, 2).map((m) => `Note by ${m.authorName}`),
      },
    ];

    if (length === 'LONG') {
      chapters.push({
        chapterTitle: 'Chapter 4 — Messages from the Heart',
        content: space.messages.map((m) => `"${m.message}" — ${m.authorName}`).join('\n\n'),
        memoryReferences: space.messages.map((m) => m.authorName),
      });
    }

    return {
      title: `Our Shared Journey with ${space.personName}`,
      chapters,
    };
  }

  async suggestTags(memorySpaceId: string): Promise<string[]> {
    const space = await prisma.memorySpace.findUnique({
      where: { id: memorySpaceId },
      include: { photos: true, videos: true, timelineEvents: true },
    });

    const suggestions = new Set<string>(['Friendship', 'College', 'Memories']);

    if (space) {
      const allText = [
        space.description,
        ...space.photos.map((p) => `${p.caption} ${p.location}`),
        ...space.videos.map((v) => `${v.title} ${v.caption}`),
        ...space.timelineEvents.map((t) => `${t.title} ${t.description}`),
      ]
        .join(' ')
        .toLowerCase();

      if (allText.includes('canteen') || allText.includes('trip') || allText.includes('manali')) suggestions.add('Travel');
      if (allText.includes('graduat') || allText.includes('farewell')) suggestions.add('Farewell');
      if (allText.includes('hackathon') || allText.includes('project')) suggestions.add('Achievement');
      if (allText.includes('party') || allText.includes('jam') || allText.includes('fest')) suggestions.add('Celebration');
      if (allText.includes('maggi') || allText.includes('funny') || allText.includes('alarm')) suggestions.add('Funny Moments');
    }

    return Array.from(suggestions);
  }
}

// Global AI service singleton instance
export const aiService: AIServiceProvider = new GroundedLocalAIService();
