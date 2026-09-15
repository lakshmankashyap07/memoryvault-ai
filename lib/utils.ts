import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return 'Sometime in memory';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function getInitials(name: string): string {
  if (!name) return 'MV';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function getAvatarBg(name: string): string {
  const colors = [
    'bg-amber-100 text-amber-800 border-amber-300',
    'bg-rose-100 text-rose-800 border-rose-300',
    'bg-emerald-100 text-emerald-800 border-emerald-300',
    'bg-sky-100 text-sky-800 border-sky-300',
    'bg-indigo-100 text-indigo-800 border-indigo-300',
    'bg-purple-100 text-purple-800 border-purple-300',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function getAppUrl(): string {
  let url = process.env.NEXT_PUBLIC_APP_URL;

  if (!url && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    url = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  } else if (!url && process.env.VERCEL_URL) {
    url = `https://${process.env.VERCEL_URL}`;
  }

  if (!url) {
    url = 'http://localhost:3000';
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  return url.replace(/\/+$/, '');
}

export function getInvitationUrl(token: string): string {
  return `${getAppUrl()}/invite/${token}`;
}

export async function downloadMediaFile(fileUrl: string, defaultFileName: string): Promise<void> {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;

    let fileName = defaultFileName.trim();
    if (!fileName.includes('.')) {
      const urlExt = fileUrl.split('?')[0].split('.').pop()?.toLowerCase();
      if (urlExt && urlExt.length >= 2 && urlExt.length <= 4) {
        fileName = `${fileName}.${urlExt}`;
      }
    }

    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.warn('Direct blob fetch download failed, falling back to opening URL:', err);
    window.open(fileUrl, '_blank');
  }
}


