"""Multi-agent newsroom workflow for the TruthPress hackathon project."""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass, field
from typing import Any, Callable

from dotenv import load_dotenv
from openai import OpenAI

from tool import search_web

load_dotenv()


DEEPSEEK_DEFAULT_BASE_URL = "https://api.deepseek.com"
DEFAULT_MODEL = os.getenv("LLM_MODEL") or os.getenv("DEEPSEEK_MODEL") or "deepseek-chat"
SEARCH_STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "but",
    "by",
    "definitely",
    "do",
    "does",
    "every",
    "for",
    "from",
    "heard",
    "i",
    "if",
    "in",
    "instant",
    "into",
    "is",
    "it",
    "its",
    "of",
    "on",
    "or",
    "rumor",
    "rumors",
    "said",
    "says",
    "so",
    "that",
    "the",
    "their",
    "there",
    "this",
    "to",
    "was",
    "were",
    "what",
    "when",
    "with",
}
HYPE_TERMS = {"collapse", "explodes", "shocking", "crazy", "panic", "chaos", "apocalypse"}


def _strip_code_fence(payload: str) -> str:
    """Remove common Markdown code fences from LLM output."""
    cleaned = payload.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    return cleaned


def _extract_json_like_text(payload: str) -> str:
    """Extract the first JSON object from a model response when needed."""
    cleaned = _strip_code_fence(payload)
    if cleaned.startswith("{") and cleaned.endswith("}"):
        return cleaned

    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        return match.group(0)
    return cleaned


def _load_json(payload: str) -> dict[str, Any]:
    """Parse model output into JSON, accepting fenced blocks and wrappers."""
    return json.loads(_extract_json_like_text(payload))


def get_runtime_settings() -> dict[str, str]:
    """Resolve provider, model, base URL, and API key from environment variables.

    Priority favors DeepSeek-specific variables, while keeping compatibility with
    generic OpenAI-compatible environment names.
    """
    api_key = (
        os.getenv("DEEPSEEK_API_KEY")
        or os.getenv("OPENAI_API_KEY")
        or os.getenv("API_KEY")
        or ""
    )
    model = os.getenv("LLM_MODEL") or os.getenv("DEEPSEEK_MODEL") or DEFAULT_MODEL
    base_url = (
        os.getenv("DEEPSEEK_BASE_URL")
        or os.getenv("OPENAI_BASE_URL")
        or os.getenv("BASE_URL")
        or ""
    )

    if not base_url and (model.startswith("deepseek") or os.getenv("DEEPSEEK_API_KEY")):
        base_url = DEEPSEEK_DEFAULT_BASE_URL

    provider = "DeepSeek" if model.startswith("deepseek") or "deepseek" in base_url.lower() else "OpenAI-Compatible"

    return {
        "provider": provider,
        "model": model,
        "base_url": base_url,
        "api_key": api_key,
    }


def _build_default_client() -> OpenAI:
    """Create an OpenAI-compatible client from runtime settings."""
    settings = get_runtime_settings()
    if not settings["api_key"]:
        raise RuntimeError(
            "Missing API key. Set DEEPSEEK_API_KEY in your environment or .env file before running the pipeline."
        )

    client_options: dict[str, Any] = {"api_key": settings["api_key"]}
    if settings["base_url"]:
        client_options["base_url"] = settings["base_url"]

    return OpenAI(**client_options)


@dataclass
class Agent:
    """Base class for all newsroom agents."""

    client: Any = field(default=None)
    model: str = DEFAULT_MODEL
    temperature: float = 0.2

    def _get_client(self) -> Any:
        """Lazily build the underlying SDK client."""
        if self.client is None:
            self.client = _build_default_client()
        return self.client

    def chat(self, messages: list[dict[str, str]], **kwargs: Any) -> str:
        """Send a chat completion request and return the text content."""
        response = self._get_client().chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=self.temperature,
            **kwargs,
        )
        return response.choices[0].message.content or ""

    def chat_json(self, messages: list[dict[str, str]]) -> str:
        """Request JSON mode for providers that support OpenAI-compatible output."""
        return self.chat(messages, response_format={"type": "json_object"})


@dataclass
class ReporterA(Agent):
    """Traffic-first intern reporter that produces a dramatic first draft."""

    temperature: float = 0.9

    def write_draft(self, topic: str) -> str:
        """Write an exaggerated article draft for the given topic."""
        messages = [
            {
                "role": "system",
                "content": (
                    "你是追求流量的实习记者，擅长写吸睛、夸张、情绪饱满的新闻草稿。"
                    "请围绕用户提供的主题，写一篇戏剧张力十足的草稿，并明确给出3个具体观点。"
                ),
            },
            {
                "role": "user",
                "content": f"请写一篇关于 {topic} 的夸张草稿，包含3个具体观点。",
            },
        ]
        return self.chat(messages)


@dataclass
class CheckerB(Agent):
    """Logic-driven fact checker that audits claims with search evidence."""

    search_func: Callable[[str, int], list[dict[str, str]]] = field(default=search_web)

    def _tokenize_text(self, text: str) -> list[str]:
        """Split mixed Chinese/English text into reusable search tokens."""
        return re.findall(r"[\u4e00-\u9fff]{2,}|[A-Za-z0-9]+", text)

    def _build_search_query(self, claim: str) -> str:
        """Compress a sensational claim into a calmer search query."""
        curated_tokens: list[str] = []
        seen: set[str] = set()

        for token in self._tokenize_text(claim):
            normalized = token.lower()
            if normalized in SEARCH_STOPWORDS or normalized in HYPE_TERMS:
                continue
            if len(normalized) == 1:
                continue
            if normalized in seen:
                continue
            seen.add(normalized)
            curated_tokens.append(token)

        if not curated_tokens:
            return claim.strip()

        if len(curated_tokens) <= 4:
            return " ".join(curated_tokens)

        head = curated_tokens[:2]
        tail = curated_tokens[-2:]
        compact_tokens: list[str] = []
        for token in head + tail:
            if token.lower() not in {item.lower() for item in compact_tokens}:
                compact_tokens.append(token)
        return " ".join(compact_tokens)

    def _score_evidence(self, claim: str, search_query: str, evidence_item: dict[str, str]) -> int:
        """Score evidence relevance using query/claim token overlap."""
        title = evidence_item.get("title", "").lower()
        snippet = evidence_item.get("snippet", "").lower()
        url = evidence_item.get("url", "").lower()
        query_tokens = {token.lower() for token in self._tokenize_text(search_query) if len(token) > 1}
        claim_tokens = {token.lower() for token in self._tokenize_text(claim) if len(token) > 1}

        query_overlap = (
            sum(3 for token in query_tokens if token in title)
            + sum(2 for token in query_tokens if token in snippet)
            + sum(2 for token in query_tokens if token in url)
        )
        claim_overlap = (
            sum(2 for token in claim_tokens if token in title)
            + sum(1 for token in claim_tokens if token in snippet)
            + sum(1 for token in claim_tokens if token in url)
        )
        has_url = 1 if evidence_item.get("url") else 0
        return query_overlap * 3 + claim_overlap + has_url

    def _select_evidence(self, claim: str, search_query: str, evidence: list[dict[str, str]]) -> list[dict[str, str]]:
        """Sort and trim evidence to the most relevant items."""
        ranked = sorted(
            evidence,
            key=lambda item: self._score_evidence(claim, search_query, item),
            reverse=True,
        )
        return ranked[:3]

    def _normalize_claim_entry(self, raw_claim: Any) -> dict[str, str]:
        """Accept either string claims or structured claim/search-query payloads."""
        if isinstance(raw_claim, dict):
            claim = str(raw_claim.get("claim", "")).strip()
            search_query = str(raw_claim.get("search_query", "")).strip()
        else:
            claim = str(raw_claim).strip()
            search_query = ""

        if not claim:
            return {}

        return {
            "claim": claim,
            "search_query": search_query or self._build_search_query(claim),
        }

    def _extract_claims(self, draft: str) -> list[dict[str, str]]:
        """Use the LLM to extract exactly three checkable claims plus search queries."""
        messages = [
            {
                "role": "system",
                "content": (
                    "你是严谨的事实核查助手。请从文章草稿中提取3条最适合被验证的明确陈述，"
                    "并为每条陈述生成一个更适合搜索引擎的简洁 search_query。"
                    '只返回 JSON，格式为 {"claims": [{"claim": "...", "search_query": "..."}]}。'
                ),
            },
            {
                "role": "user",
                "content": f"草稿如下：\n{draft}",
            },
        ]
        payload = _load_json(self.chat_json(messages))
        claims = payload.get("claims", [])
        normalized_claims = [self._normalize_claim_entry(claim) for claim in claims]
        return [claim for claim in normalized_claims if claim][:3]

    def _judge_claim(self, claim: str, search_query: str, evidence: list[dict[str, str]]) -> dict[str, Any]:
        """Use the LLM to determine whether a claim is supported by evidence."""
        messages = [
            {
                "role": "system",
                "content": (
                    "你是逻辑严谨的事实审计员。请根据给定的 Claim 和搜索证据判断结论。"
                    '只返回 JSON，格式为 {"verdict": "true|false|uncertain", "reason": "简短说明"}。'
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Claim:\n{claim}\n\n"
                    f"Search Query:\n{search_query}\n\n"
                    f"Search Result:\n{json.dumps(evidence, ensure_ascii=False, indent=2)}"
                ),
            },
        ]
        payload = _load_json(self.chat_json(messages))
        verdict = str(payload.get("verdict", "uncertain")).strip().lower()
        if verdict not in {"true", "false", "uncertain"}:
            verdict = "uncertain"

        return {
            "claim": claim,
            "search_query": search_query,
            "verdict": verdict,
            "reason": str(payload.get("reason", "")).strip(),
            "evidence": evidence,
            "source": evidence[0].get("url", "") if evidence else "",
        }

    def run_audit(self, draft: str) -> dict[str, Any]:
        """Audit a draft by extracting claims, searching evidence, and scoring them."""
        claims = self._extract_claims(draft)
        items: list[dict[str, Any]] = []

        for claim_entry in claims:
            claim = claim_entry["claim"]
            search_query = claim_entry["search_query"]
            raw_evidence = self.search_func(search_query, max_results=5)
            evidence = self._select_evidence(claim, search_query, raw_evidence)
            items.append(self._judge_claim(claim, search_query, evidence))

        true_claims = sum(1 for item in items if item["verdict"] == "true")
        false_claims = sum(1 for item in items if item["verdict"] == "false")
        uncertain_claims = sum(1 for item in items if item["verdict"] == "uncertain")

        return {
            "draft": draft,
            "summary": {
                "total_claims": len(items),
                "true_claims": true_claims,
                "false_claims": false_claims,
                "uncertain_claims": uncertain_claims,
            },
            "items": items,
        }


@dataclass
class EditorC(Agent):
    """Editor that rewrites the article based on audit conclusions."""

    def rewrite(self, draft: str, audit_report: dict[str, Any]) -> str:
        """Rewrite the draft, debunk falsehoods, and preserve supported claims."""
        messages = [
            {
                "role": "system",
                "content": (
                    "根据 draft 和 audit report，重写文章。辟谣错误，保留正确内容，并在引用证据时"
                    "尽量附上来源链接。输出一篇更可信、可直接发布的中文报道。"
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Draft:\n{draft}\n\n"
                    f"Audit Report:\n{json.dumps(audit_report, ensure_ascii=False, indent=2)}"
                ),
            },
        ]
        return self.chat(messages)
