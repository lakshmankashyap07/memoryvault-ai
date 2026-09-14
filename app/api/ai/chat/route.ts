import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { aiService } from '@/lib/services/ai-service';

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    const { memorySpaceId, question, memoryId } = await req.json();

    if (!question || (!memorySpaceId && !memoryId)) {
      return NextResponse.json({ error: 'Question and Memory Space ID are required' }, { status: 400 });
    }

    // Resolve memorySpaceId if memoryId string (e.g. MEM-RH-2026-8294) was passed
    let space = await prisma.memorySpace.findFirst({
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
      return NextResponse.json(
        { error: 'Private Memory Space. Access denied.' },
        { status: 403 }
      );
    }

    // Check if AI assistant feature is enabled for this space
    if (space.aiSettings && !space.aiSettings.enableAssistant) {
      return NextResponse.json(
        { error: 'AI Assistant features are disabled for this Memory Space.' },
        { status: 403 }
      );
    }

    // RAG AI response generation grounded strictly in this memory space
    const aiResponse = await aiService.askMemories(space.id, question, currentUser?.id || 'guest');

    // Save conversation history if user is logged in
    if (currentUser) {
      try {
        let conversation = await prisma.aIConversation.findFirst({
          where: { memorySpaceId: space.id, userId: currentUser.id },
        });

        if (!conversation) {
          conversation = await prisma.aIConversation.create({
            data: {
              memorySpaceId: space.id,
              userId: currentUser.id,
              title: `Memory Chat with ${space.personName}`,
            },
          });
        }

        await prisma.aIMessage.createMany({
          data: [
            {
              conversationId: conversation.id,
              role: 'user',
              content: question,
            },
            {
              conversationId: conversation.id,
              role: 'assistant',
              content: aiResponse.answer,
              sources: JSON.stringify(aiResponse.sources),
            },
          ],
        });
      } catch (err) {
        console.error('Save AI chat history error:', err);
      }
    }

    return NextResponse.json({
      answer: aiResponse.answer,
      sources: aiResponse.sources,
      confidenceLabel: aiResponse.confidenceLabel,
      success: true,
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { error: 'AI features are temporarily unavailable. Your memory data remains safely saved.' },
      { status: 500 }
    );
  }
}
