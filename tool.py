"""Utility helpers for external tools used by the newsroom agents."""

from __future__ import annotations

from typing import Any

try:
    from duckduckgo_search import DDGS
except ImportError:  # pragma: no cover - exercised indirectly in runtime environments
    DDGS = None


def _normalize_search_result(result: dict[str, Any]) -> dict[str, str]:
    """Convert DuckDuckGo's raw payload into a stable result shape."""
    return {
        "title": str(result.get("title", "")).strip(),
        "url": str(result.get("href", "") or result.get("url", "")).strip(),
        "snippet": str(result.get("body", "") or result.get("snippet", "")).strip(),
    }


def search_web(query: str, max_results: int = 5) -> list[dict[str, str]]:
    """Search the web with DuckDuckGo and return normalized evidence snippets.

    The function never raises provider errors to the caller. When the search
    backend is unavailable, it returns a single fallback record describing the
    issue so downstream agents can still produce an audit report gracefully.
    """
    normalized_query = query.strip()
    if not normalized_query:
        raise ValueError("query must not be empty")

    if DDGS is None:
        return [
            {
                "title": "Search unavailable",
                "url": "",
                "snippet": "duckduckgo-search is not installed in the current environment.",
            }
        ]

    try:
        with DDGS() as ddgs:
            raw_results = ddgs.text(normalized_query, max_results=max_results)
            normalized_results = [_normalize_search_result(item) for item in raw_results]
            if normalized_results:
                return normalized_results
            return [
                {
                    "title": "No search results",
                    "url": "",
                    "snippet": f'No public search results were returned for query: "{normalized_query}".',
                }
            ]
    except Exception as error:
        return [
            {
                "title": "Search unavailable",
                "url": "",
                "snippet": f"Failed to retrieve search results: {error}",
            }
        ]
