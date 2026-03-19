import { type SearchEvidence } from "./types";

// ============ Tavily Search (优先) ============

type TavilyResult = {
  title: string;
  content: string;
  url: string;
  score?: number;
};

type TavilyResponse = {
  answer?: string;
  results: TavilyResult[];
};

async function searchWithTavily(query: string): Promise<SearchEvidence[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY not configured");
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query: query,
      search_depth: "basic",
      max_results: 5,
      include_answer: false,
      include_images: false,
      include_raw_content: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily API error: ${response.status}`);
  }

  const data = (await response.json()) as TavilyResponse;

  if (data.results.length === 0) {
    return [];
  }

  return data.results.slice(0, 3).map((r) => ({
    title: r.title,
    snippet: r.content,
    url: r.url,
  }));
}

// ============ DuckDuckGo (备用) ============

type DuckDuckGoTopic = {
  Text?: string;
  FirstURL?: string;
  Name?: string;
  Topics?: DuckDuckGoTopic[];
};

function flattenTopics(topics: DuckDuckGoTopic[]): DuckDuckGoTopic[] {
  return topics.flatMap((topic) => (topic.Topics ? flattenTopics(topic.Topics) : [topic]));
}

async function searchWithDuckDuckGo(query: string): Promise<SearchEvidence[]> {
  const response = await fetch(
    `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
    {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`DuckDuckGo error: ${response.status}`);
  }

  const payload = (await response.json()) as {
    Heading?: string;
    AbstractText?: string;
    AbstractURL?: string;
    RelatedTopics?: DuckDuckGoTopic[];
  };

  const results: SearchEvidence[] = [];

  if (payload.AbstractText && payload.AbstractURL) {
    results.push({
      title: payload.Heading || query,
      snippet: payload.AbstractText,
      url: payload.AbstractURL,
    });
  }

  const relatedTopics = flattenTopics(payload.RelatedTopics || []);
  for (const topic of relatedTopics) {
    if (!topic.Text || !topic.FirstURL) {
      continue;
    }

    results.push({
      title: topic.Text.split(" - ")[0] || query,
      snippet: topic.Text,
      url: topic.FirstURL,
    });

    if (results.length >= 3) {
      break;
    }
  }

  return results;
}

// ============ 主搜索函数 ============

export async function searchWeb(query: string): Promise<SearchEvidence[]> {
  // 优先使用 Tavily（如果配置了）
  if (process.env.TAVILY_API_KEY) {
    try {
      const results = await searchWithTavily(query);
      if (results.length > 0) {
        return results;
      }
    } catch (error) {
      console.warn("Tavily search failed, falling back to DuckDuckGo:", error);
    }
  }

  // 备用 DuckDuckGo
  try {
    const results = await searchWithDuckDuckGo(query);
    if (results.length > 0) {
      return results;
    }
  } catch (error) {
    console.warn("DuckDuckGo search also failed:", error);
  }

  // 都失败了
  return [
    {
      title: "搜索不可用",
      snippet: "请配置 TAVILY_API_KEY 环境变量以启用搜索功能。访问 https://tavily.com 获取免费 API Key。",
      url: "",
    },
  ];
}
