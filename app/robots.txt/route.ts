import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rnd.so';
  
  const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /admin/

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Specific rules for major search engines
User-agent: Googlebot
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /admin/

User-agent: Bingbot
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /admin/

User-agent: Slurp
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /admin/`;

  return new NextResponse(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
