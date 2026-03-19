"""Reusable Streamlit UI helpers for the TruthPress demo."""

from __future__ import annotations

from pathlib import Path

import streamlit as st


STYLE_PATH = Path(__file__).with_name("style.css")


def inject_custom_css() -> None:
    """Load the cyberpunk stylesheet used by the app."""
    st.markdown(f"<style>{STYLE_PATH.read_text(encoding='utf-8')}</style>", unsafe_allow_html=True)


def render_header() -> None:
    """Render the app hero section."""
    st.markdown(
        """
        <div style="text-align:center; padding:2rem 0 1rem 0;">
            <div style="color:#00F0FF; letter-spacing:0.22rem; text-transform:uppercase; font-size:0.85rem;">
                Agent 求真报社
            </div>
            <h1 style="margin:0.4rem 0 0.2rem 0;">TruthPress · 对抗式新闻生产流水线</h1>
            <p style="color:#8B949E; font-size:1.05rem; margin-top:0.4rem;">
                Reporter A 负责写爆款，Checker B 负责查真伪，Editor C 负责把结果写成可信新闻。
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_topic_input(default_value: str) -> str:
    """Render the topic input box."""
    return st.text_input(
        "输入新闻主题",
        value=default_value,
        placeholder="例如：OpenAI 最新模型发布后，对开发者意味着什么？",
    )


def render_start_button() -> bool:
    """Render the primary action button."""
    return st.button("启动求真流水线", use_container_width=True, type="primary")


def render_progress_bar(progress: float) -> str:
    """Return the HTML for the custom neon progress bar."""
    return f"""
    <div class="progress-container">
        <div class="progress-bar" style="width:{progress}%;"></div>
    </div>
    """


def render_evidence_card(
    claim: str,
    verdict: str,
    evidence: str = "",
    source: str = "",
    reason: str = "",
) -> None:
    """Render one evidence card for Checker B."""
    normalized_verdict = verdict.lower()
    card_class = {
        "true": "support",
        "false": "refute",
        "uncertain": "uncertain",
    }.get(normalized_verdict, "uncertain")
    icon = {"true": "✅", "false": "❌", "uncertain": "⚠️"}.get(normalized_verdict, "⚠️")
    label = {"true": "支持", "false": "辟谣", "uncertain": "存疑"}.get(normalized_verdict, "存疑")

    st.markdown(
        f"""
        <div class="evidence-card {card_class}">
            <div class="status-indicator status-{card_class}" style="margin-bottom:0.75rem;">
                <span>{icon}</span>
                <span>{label}</span>
            </div>
            <p class="evidence-claim">{claim}</p>
            {f'<p class="evidence-detail">判定理由：{reason}</p>' if reason else ''}
            {f'<p class="evidence-detail">证据摘要：{evidence}</p>' if evidence else ''}
            {f'<p class="evidence-source">来源：{source}</p>' if source else ''}
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_footer() -> None:
    """Render the footer."""
    st.markdown(
        """
        <div style="text-align:center; padding:2rem 0; color:#6E7681; font-size:0.85rem;">
            <p>TruthPress Hackathon Demo · Python Multi-Agent System</p>
            <p>OpenAI + DuckDuckGo Search + Streamlit</p>
        </div>
        """,
        unsafe_allow_html=True,
    )
