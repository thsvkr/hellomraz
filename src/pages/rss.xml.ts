import type { APIRoute } from 'astro';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { getPublishedPosts } from '../lib/blog-data.mjs';

const XML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => XML_ENTITIES[character]);
}

export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error('Site URL is required to generate RSS feed');

  const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
  const posts = await getPublishedPosts();
  const items = posts
    .map((post) => {
      const link = new URL(`${base}blog/${post.id}/`, site).href;
      const categories = (post.data.tags ?? [])
        .map((tag) => `<category>${escapeXml(tag)}</category>`)
        .join('');

      return `<item>
        <title>${escapeXml(post.data.title)}</title>
        <link>${escapeXml(link)}</link>
        <guid isPermaLink="true">${escapeXml(link)}</guid>
        <pubDate>${post.data.pubDate.toUTCString()}</pubDate>
        <description>${escapeXml(post.data.description ?? '')}</description>
        ${categories}
      </item>`;
    })
    .join('');

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>${escapeXml(SITE_TITLE)}</title>
        <link>${escapeXml(site.href)}</link>
        <description>${escapeXml(SITE_DESCRIPTION)}</description>
        ${items}
      </channel>
    </rss>`;

  return new Response(feed, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
