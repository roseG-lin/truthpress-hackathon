"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchWeb = searchWeb;
function flattenTopics(topics) {
    return topics.flatMap((topic) => (topic.Topics ? flattenTopics(topic.Topics) : [topic]));
}
async function searchWeb(query) {
    try {
        const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`, {
            headers: {
                Accept: "application/json",
            },
            cache: "no-store",
        });
        if (!response.ok) {
            throw new Error(`Search request failed with status ${response.status}`);
        }
        const payload = (await response.json());
        const results = [];
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
        if (results.length === 0) {
            return [
                {
                    title: "No search results",
                    snippet: `No public search results were returned for "${query}".`,
                    url: "",
                },
            ];
        }
        return results.slice(0, 3);
    }
    catch (error) {
        return [
            {
                title: "Search unavailable",
                snippet: error instanceof Error ? error.message : "Unexpected search error.",
                url: "",
            },
        ];
    }
}
