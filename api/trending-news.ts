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
  url.searchParams.set("lang", "en");
  url.searchParams.set("country", "us");
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

  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 20);

  try {
    // 同時抓財經、科技、國際新聞（3 個主題各 10 則）
    const [bizResult, techResult, worldResult] = await Promise.all([
      fetchTopic(apiKey, "business", 10),
      fetchTopic(apiKey, "technology", 10),
      fetchTopic(apiKey, "world", 10),
    ]);

    const errors = [bizResult.error, techResult.error, worldResult.error].filter(Boolean);

    // 交錯合併：財經 > 科技 > 國際（每輪 biz, tech, world）
    const seen = new Set<string>();
    const merged: GNewsArticle[] = [];
    const sources = [bizResult.articles, techResult.articles, worldResult.articles];
    const idx = [0, 0, 0];

    while (merged.length < 30 && sources.some((s, i) => idx[i] < s.length)) {
      for (let s = 0; s < sources.length; s++) {
        if (idx[s] < sources[s].length) {
          const a = sources[s][idx[s]++];
          if (!seen.has(a.title)) { seen.add(a.title); merged.push(a); }
        }
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
