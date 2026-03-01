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
    const url = new URL("https://gnews.io/api/v4/top-headlines");
    url.searchParams.set("token", apiKey);
    url.searchParams.set("lang", "zh");
    url.searchParams.set("topic", "business");
    url.searchParams.set("max", String(limit));

    const response = await fetch(url.toString());

    if (!response.ok) {
      return res.status(502).json({ error: `GNews API error: ${response.status}` });
    }

    const data = (await response.json()) as GNewsResponse;

    const articles = data.articles.map((a, i) => ({
      rank: i + 1,
      title: a.title,
      description: a.description,
      source: a.source.name,
      publishedAt: a.publishedAt,
      url: a.url,
    }));

    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json({
      totalArticles: data.totalArticles,
      showing: articles.length,
      articles,
    });
  } catch (err) {
    return res.status(502).json({ error: "Failed to fetch news" });
  }
}
