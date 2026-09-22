import axios from 'axios';
import * as cheerio from 'cheerio';

export async function fetchPage(url: string) {
  try {
    const r = await axios.get(url, { timeout: 8000, headers: { 'User-Agent': 'trao-kit-bot/0.1' } });
    return { url, text: r.data as string };
  } catch (e) {
    return { url, text: '' };
  }
}

export function extractLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html || '');
  const links: string[] = [];
  $('a[href]').each((_, el) => {
    const h = $(el).attr('href') || '';
    if (h.startsWith('http')) links.push(h);
    else if (h.startsWith('/')) {
      try {
        const u = new URL(baseUrl);
        links.push(u.origin + h);
      } catch (_) {}
    }
  });
  return Array.from(new Set(links)).slice(0, 30);
}
