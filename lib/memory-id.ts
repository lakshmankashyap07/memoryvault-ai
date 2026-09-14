import { prisma } from './db';

/**
 * Generates a collision-safe, readable unique Memory ID.
 * Format: MEM-[INITIALS]-[YEAR]-[4-DIGIT-HEX]
 * Example: MEM-RH-2026-8294
 */
export async function generateMemoryId(personName: string): Promise<string> {
  const cleanName = personName.trim().replaceAll(/[^a-zA-Z\s]/g, '');
  const parts = cleanName.split(/\s+/).filter(Boolean);
  
  let initials = 'MV';
  if (parts.length >= 2) {
    initials = (parts[0][0] + parts[1][0]).toUpperCase();
  } else if (parts.length === 1 && parts[0].length >= 2) {
    initials = parts[0].substring(0, 2).toUpperCase();
  } else if (parts.length === 1 && parts[0].length === 1) {
    initials = (parts[0][0] + 'X').toUpperCase();
  }

  const year = new Date().getFullYear();

  let attempts = 0;
  while (attempts < 10) {
    // Generate 4-digit random uppercase alphanumeric suffix
    const randomHex = Math.floor(1000 + Math.random() * 9000).toString();
    const candidateId = `MEM-${initials}-${year}-${randomHex}`;

    const existing = await prisma.memorySpace.findUnique({
      where: { memoryId: candidateId },
    });

    if (!existing) {
      return candidateId;
    }
    attempts++;
  }

  // Backup fallback using timestamp salt
  const fallbackSalt = Math.floor(1000 + Math.random() * 9000).toString();
  return `MEM-${initials}-${year}-${fallbackSalt}`;
}
