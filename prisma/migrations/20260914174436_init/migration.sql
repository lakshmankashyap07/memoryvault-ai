-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "profileImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemorySpace" (
    "id" TEXT NOT NULL,
    "memoryId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "nickname" TEXT,
    "profileImage" TEXT,
    "relationship" TEXT NOT NULL,
    "description" TEXT,
    "birthday" TEXT,
    "firstMeetingDate" TEXT,
    "specialDate" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "instagram" TEXT,
    "linkedin" TEXT,
    "socialLinks" TEXT,
    "privacy" TEXT NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemorySpace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryPhoto" (
    "id" TEXT NOT NULL,
    "memorySpaceId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "caption" TEXT,
    "date" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryVideo" (
    "id" TEXT NOT NULL,
    "memorySpaceId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "title" TEXT,
    "caption" TEXT,
    "date" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryMessage" (
    "id" TEXT NOT NULL,
    "memorySpaceId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "authorAvatar" TEXT,
    "title" TEXT,
    "message" TEXT NOT NULL,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "memorySpaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contributor" (
    "id" TEXT NOT NULL,
    "memorySpaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CONTRIBUTOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contributor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "memorySpaceId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CONTRIBUTOR',
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryEmbedding" (
    "id" TEXT NOT NULL,
    "memorySpaceId" TEXT NOT NULL,
    "memoryType" TEXT NOT NULL,
    "memoryId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemoryEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAnalysis" (
    "id" TEXT NOT NULL,
    "memorySpaceId" TEXT NOT NULL,
    "memoryId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'grounded-local-v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL,
    "memorySpaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Memory Assistant Chat',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sources" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryTag" (
    "id" TEXT NOT NULL,
    "memorySpaceId" TEXT NOT NULL,
    "memoryId" TEXT,
    "tag" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'AI',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryStory" (
    "id" TEXT NOT NULL,
    "memorySpaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "length" TEXT NOT NULL,
    "chapters" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryStory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISettings" (
    "id" TEXT NOT NULL,
    "memorySpaceId" TEXT NOT NULL,
    "enableSearch" BOOLEAN NOT NULL DEFAULT true,
    "enableDescriptions" BOOLEAN NOT NULL DEFAULT true,
    "enableTimeline" BOOLEAN NOT NULL DEFAULT true,
    "enableStory" BOOLEAN NOT NULL DEFAULT true,
    "enableAssistant" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MemorySpace_memoryId_key" ON "MemorySpace"("memoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Contributor_memorySpaceId_userId_key" ON "Contributor"("memorySpaceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "MemoryEmbedding_memorySpaceId_idx" ON "MemoryEmbedding"("memorySpaceId");

-- CreateIndex
CREATE INDEX "MemoryEmbedding_memoryType_memoryId_idx" ON "MemoryEmbedding"("memoryType", "memoryId");

-- CreateIndex
CREATE UNIQUE INDEX "MemoryTag_memorySpaceId_tag_memoryId_key" ON "MemoryTag"("memorySpaceId", "tag", "memoryId");

-- CreateIndex
CREATE UNIQUE INDEX "AISettings_memorySpaceId_key" ON "AISettings"("memorySpaceId");

-- AddForeignKey
ALTER TABLE "MemorySpace" ADD CONSTRAINT "MemorySpace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryPhoto" ADD CONSTRAINT "MemoryPhoto_memorySpaceId_fkey" FOREIGN KEY ("memorySpaceId") REFERENCES "MemorySpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryVideo" ADD CONSTRAINT "MemoryVideo_memorySpaceId_fkey" FOREIGN KEY ("memorySpaceId") REFERENCES "MemorySpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryMessage" ADD CONSTRAINT "MemoryMessage_memorySpaceId_fkey" FOREIGN KEY ("memorySpaceId") REFERENCES "MemorySpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryMessage" ADD CONSTRAINT "MemoryMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_memorySpaceId_fkey" FOREIGN KEY ("memorySpaceId") REFERENCES "MemorySpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contributor" ADD CONSTRAINT "Contributor_memorySpaceId_fkey" FOREIGN KEY ("memorySpaceId") REFERENCES "MemorySpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contributor" ADD CONSTRAINT "Contributor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_memorySpaceId_fkey" FOREIGN KEY ("memorySpaceId") REFERENCES "MemorySpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryEmbedding" ADD CONSTRAINT "MemoryEmbedding_memorySpaceId_fkey" FOREIGN KEY ("memorySpaceId") REFERENCES "MemorySpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_memorySpaceId_fkey" FOREIGN KEY ("memorySpaceId") REFERENCES "MemorySpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_memorySpaceId_fkey" FOREIGN KEY ("memorySpaceId") REFERENCES "MemorySpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryTag" ADD CONSTRAINT "MemoryTag_memorySpaceId_fkey" FOREIGN KEY ("memorySpaceId") REFERENCES "MemorySpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryStory" ADD CONSTRAINT "MemoryStory_memorySpaceId_fkey" FOREIGN KEY ("memorySpaceId") REFERENCES "MemorySpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISettings" ADD CONSTRAINT "AISettings_memorySpaceId_fkey" FOREIGN KEY ("memorySpaceId") REFERENCES "MemorySpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
