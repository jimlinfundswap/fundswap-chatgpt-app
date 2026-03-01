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

async function fetchTopic(apiKey: string, topic: string, max: number): Promise<{ articles: GNewsArticle[]; error?: string }> {
  const url = new URL("https://gnews.io/api/v4/top-headlines");
  url.searchParams.set("token", apiKey);
  url.searchParams.set("lang", "zh");
  url.searchParams.set("country", "tw");
  url.searchParams.set("topic", topic);
  url.searchParams.set("max", String(max));

  const response = await fetch(url.toString());
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return { articles: [], error: `${topic}: HTTP ${response.status} ${text.slice(0, 200)}` };
  }

  const data = (await response.json()) as GNewsResponse;
  return { articles: data.articles ?? [] };
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
    const [worldResult, bizResult] = await Promise.all([
      fetchTopic(apiKey, "world", limit),
      fetchTopic(apiKey, "business", limit),
    ]);

    const errors = [worldResult.error, bizResult.error].filter(Boolean);

    // 去重（依 title）並交錯合併：先國際再財經
    const seen = new Set<string>();
    const merged: GNewsArticle[] = [];

    for (const a of [...worldResult.articles, ...bizResult.articles]) {
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

    // 只在有結果時快取，避免錯誤結果被長期快取
    if (articles.length > 0) {
      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    }
    return res.status(200).json({
      showing: articles.length,
      articles,
      ...(errors.length > 0 ? { _debug: errors } : {}),
    });
  } catch (err) {
    return res.status(502).json({ error: "Failed to fetch news" });
  }
}
