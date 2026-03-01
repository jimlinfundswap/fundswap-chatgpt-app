import type { VercelRequest, VercelResponse } from "@vercel/node";

interface GNewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: { name: string; url: string };
}

interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

async function fetchTopic(apiKey: string, topic: string, max: number): Promise<GNewsArticle[]> {
  const url = new URL("https://gnews.io/api/v4/top-headlines");
  url.searchParams.set("token", apiKey);
  url.searchParams.set("lang", "zh");
  url.searchParams.set("country", "tw");
  url.searchParams.set("topic", topic);
  url.searchParams.set("max", String(max));

  const response = await fetch(url.toString());
  if (!response.ok) return [];

  const data = (await response.json()) as GNewsResponse;
  return data.articles ?? [];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GNEWS_API_KEY not configured" });
  }

  const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 10);

  try {
    // 同時抓國際大事和財經新聞，合併去重後取前 N 則
    const [worldArticles, bizArticles] = await Promise.all([
      fetchTopic(apiKey, "world", limit),
      fetchTopic(apiKey, "business", limit),
    ]);

    // 去重（依 title）並交錯合併：先國際再財經
    const seen = new Set<string>();
    const merged: GNewsArticle[] = [];

    for (const a of [...worldArticles, ...bizArticles]) {
      if (!seen.has(a.title)) {
        seen.add(a.title);
        merged.push(a);
      }
    }

    const articles = merged.slice(0, limit).map((a, i) => ({
      rank: i + 1,
      title: a.title,
      description: a.description,
      source: a.source.name,
      publishedAt: a.publishedAt,
      url: a.url,
    }));

    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json({
      showing: articles.length,
      articles,
    });
  } catch (err) {
    return res.status(502).json({ error: "Failed to fetch news" });
  }
}
