"""Streamlit demo for the TruthPress multi-agent newsroom."""

from __future__ import annotations

import json
import re
import time
from typing import Any

import streamlit as st

from agent import CheckerB, EditorC, ReporterA, get_runtime_settings
from components.ui_components import (
    inject_custom_css,
    render_evidence_card,
    render_footer,
    render_header,
    render_progress_bar,
    render_start_button,
    render_topic_input,
)


DEFAULT_TOPIC = "量子纠缠真的能实现超光速通信吗？"


def summarize_audit_metrics(audit_report: dict[str, Any]) -> dict[str, float]:
    """Summarize audit counts for the dashboard metric strip."""
    summary = audit_report.get("summary", {})
    total = int(summary.get("total_claims", 0))
    true_claims = int(summary.get("true_claims", 0))
    false_claims = int(summary.get("false_claims", 0))
    uncertain_claims = int(summary.get("uncertain_claims", 0))
    accuracy_rate = round((true_claims / total) * 100, 2) if total else 0.0

    return {
        "total": total,
        "true": true_claims,
        "false": false_claims,
        "uncertain": uncertain_claims,
        "accuracy_rate": accuracy_rate,
    }


def build_download_filename(topic: str) -> str:
    """Build a safe markdown filename based on the topic."""
    collapsed = re.sub(r"\s+", "_", topic.strip())
    sanitized = re.sub(r'[\\/:*?"<>|]+', "_", collapsed)
    sanitized = re.sub(r"_+", "_", sanitized).strip("._")
    return f"TruthPress_{sanitized or 'article'}.md"


def build_stage_statuses(has_draft: bool, has_audit: bool, has_final: bool) -> dict[str, str]:
    """Return UI statuses for the three-stage pipeline."""
    if has_final:
        return {"reporter": "completed", "checker": "completed", "editor": "completed"}
    if has_audit:
        return {"reporter": "completed", "checker": "completed", "editor": "processing"}
    if has_draft:
        return {"reporter": "completed", "checker": "processing", "editor": "pending"}
    return {"reporter": "processing", "checker": "pending", "editor": "pending"}


def build_runtime_summary(settings: dict[str, str]) -> str:
    """Format the active provider, model, and base URL for the UI."""
    provider = settings.get("provider", "Unknown")
    model = settings.get("model", "Unknown")
    base_url = settings.get("base_url") or "SDK default"
    return f"Provider: {provider} | Model: {model} | Base URL: {base_url}"


def initialize_page() -> None:
    """Configure the Streamlit page and load shared CSS."""
    st.set_page_config(
        page_title="TruthPress 求真报社",
        page_icon="📰",
        layout="wide",
        initial_sidebar_state="collapsed",
    )
    inject_custom_css()


def initialize_session_state() -> None:
    """Create long-lived agent instances and pipeline state."""
    defaults = {
        "reporter": ReporterA(),
        "checker": CheckerB(),
        "editor": EditorC(),
        "draft": "",
        "audit_report": None,
        "final_article": "",
        "last_topic": DEFAULT_TOPIC,
        "last_error": "",
    }

    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


def render_runtime_banner() -> None:
    """Show runtime configuration and quick setup guidance."""
    settings = get_runtime_settings()
    st.caption(build_runtime_summary(settings))

    if not settings.get("api_key"):
        st.warning(
            "尚未检测到 `DEEPSEEK_API_KEY`。复制 `.env.example` 为 `.env` 后填入你的 DeepSeek Key，"
            "再点击启动流水线。"
        )
    elif not settings.get("base_url"):
        st.info("当前未显式设置 Base URL；DeepSeek 模式下会自动使用官方默认地址。")


def render_control_panel() -> tuple[str, bool]:
    """Render the input area and start button."""
    st.markdown(
        """
        <div class="column-block" style="margin-bottom: 1.5rem;">
            <div style="display:flex; justify-content:space-between; gap:1rem; align-items:flex-start; flex-wrap:wrap;">
                <div>
                    <div style="color:#00F0FF; font-size:0.85rem; letter-spacing:0.16rem; text-transform:uppercase;">
                        Assignment Desk
                    </div>
                    <h3 style="margin:0.4rem 0 0.2rem 0;">给求真报社一个值得核查的话题</h3>
                    <p style="margin:0; color:#8B949E;">
                        Reporter A 先写夸张草稿，Checker B 逐条查证，Editor C 最后重写成可信版本。
                    </p>
                </div>
                <div style="min-width:220px; text-align:right; color:#8B949E; font-size:0.85rem;">
                    适配 DeepSeek API · OpenAI SDK
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    topic = render_topic_input(default_value=st.session_state.get("last_topic", DEFAULT_TOPIC))
    start_clicked = render_start_button()
    return topic, start_clicked


def render_metric_strip(audit_report: dict[str, Any] | None) -> None:
    """Render high-level pipeline metrics."""
    metrics = summarize_audit_metrics(audit_report or {"summary": {}})
    items = [
        ("Claims", metrics["total"], "#00F0FF"),
        ("Verified", metrics["true"], "#00FF94"),
        ("Debunked", metrics["false"], "#FF6B6B"),
        ("Credibility", f'{metrics["accuracy_rate"]:.2f}%', "#7B61FF"),
    ]
    columns = st.columns(4)

    for column, (label, value, color) in zip(columns, items):
        with column:
            st.markdown(
                f"""
                <div class="column-block" style="padding:1rem; min-height:130px;">
                    <div style="color:{color}; font-size:0.8rem; letter-spacing:0.15rem; text-transform:uppercase;">
                        {label}
                    </div>
                    <div style="font-size:2rem; font-weight:700; margin-top:0.5rem; color:#E6EDF3;">
                        {value}
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )


def render_stage_header(stage_num: int, title: str, agent_name: str, status: str) -> None:
    """Render a cyberpunk stage card header."""
    colors = {
        "pending": "#6E7681",
        "processing": "#00F0FF",
        "completed": "#00FF94",
        "error": "#FF6B6B",
    }
    color = colors.get(status, "#6E7681")
    status_label = {
        "pending": "待命",
        "processing": "执行中",
        "completed": "已完成",
        "error": "出错",
    }.get(status, "待命")

    st.markdown(
        f"""
        <div class="column-block" style="border-color:{color}; min-height:120px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">
                <div>
                    <div style="color:{color}; font-size:0.75rem; letter-spacing:0.18rem; text-transform:uppercase;">
                        Phase {stage_num}
                    </div>
                    <h3 style="margin:0.45rem 0 0.25rem 0; color:#E6EDF3;">{title}</h3>
                    <p style="margin:0; color:#8B949E;">{agent_name}</p>
                </div>
                <div style="padding:0.35rem 0.75rem; border:1px solid {color}; border-radius:999px; color:{color};">
                    {status_label}
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_draft_panel(draft: str, status: str) -> None:
    """Render Reporter A output."""
    render_stage_header(1, "流量草稿", "Reporter A · 夸张派实习记者", status)
    if draft:
        st.markdown(
            f"""
            <div class="column-block" style="min-height:360px;">
                <div style="color:#E6EDF3; line-height:1.8; white-space:pre-wrap;">{draft}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    else:
        st.info("等待选题输入后生成初稿。")


def render_audit_panel(audit_report: dict[str, Any] | None, status: str) -> None:
    """Render Checker B evidence cards."""
    render_stage_header(2, "事实审计", "Checker B · 证据驱动核查员", status)
    if not audit_report:
        st.info("这里会展示抽取出的 Claims、判定结果和搜索证据。")
        return

    metrics = summarize_audit_metrics(audit_report)
    st.markdown(
        f"""
        <div class="column-block" style="margin-bottom:1rem;">
            <div style="display:flex; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
                <span>共核查 <strong>{metrics["total"]}</strong> 条 Claim</span>
                <span style="color:#00FF94;">通过 {metrics["true"]}</span>
                <span style="color:#FF6B6B;">辟谣 {metrics["false"]}</span>
                <span style="color:#7B61FF;">可信度 {metrics["accuracy_rate"]:.2f}%</span>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    for item in audit_report.get("items", []):
        evidence = item.get("evidence", [])
        top_source = evidence[0]["url"] if evidence else ""
        snippets = " / ".join(entry.get("snippet", "") for entry in evidence[:2] if entry.get("snippet"))
        render_evidence_card(
            claim=item.get("claim", ""),
            verdict=item.get("verdict", "uncertain"),
            evidence=snippets,
            source=top_source,
            reason=item.get("reason", ""),
        )


def render_final_panel(topic: str, final_article: str, status: str) -> None:
    """Render Editor C final article and download control."""
    render_stage_header(3, "可信成稿", "Editor C · 总编修订官", status)
    if not final_article:
        st.info("核查完成后，这里会输出可直接发布的终稿。")
        return

    st.markdown(
        f"""
        <div class="column-block" style="border-color:#00FF94; min-height:360px;">
            <div style="color:#E6EDF3; line-height:1.85; white-space:pre-wrap;">{final_article}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    st.download_button(
        label="下载可信稿（Markdown）",
        data=final_article,
        file_name=build_download_filename(topic),
        mime="text/markdown",
        use_container_width=True,
    )


def run_pipeline(topic: str) -> None:
    """Execute the three-agent workflow with visual progress updates."""
    st.session_state.last_topic = topic
    st.session_state.last_error = ""
    progress_placeholder = st.empty()
    status_placeholder = st.empty()

    try:
        progress_placeholder.markdown(render_progress_bar(10), unsafe_allow_html=True)
        status_placeholder.info("Reporter A 正在制造一篇极具传播性的草稿…")
        time.sleep(0.3)
        draft = st.session_state.reporter.write_draft(topic)
        st.session_state.draft = draft

        progress_placeholder.markdown(render_progress_bar(45), unsafe_allow_html=True)
        status_placeholder.info("Checker B 正在抽取 Claims 并联网核查…")
        time.sleep(0.3)
        audit_report = st.session_state.checker.run_audit(draft)
        st.session_state.audit_report = audit_report

        progress_placeholder.markdown(render_progress_bar(78), unsafe_allow_html=True)
        status_placeholder.info("Editor C 正在根据核查结果改写终稿…")
        time.sleep(0.3)
        final_article = st.session_state.editor.rewrite(draft, audit_report)
        st.session_state.final_article = final_article

        progress_placeholder.markdown(render_progress_bar(100), unsafe_allow_html=True)
        status_placeholder.success("求真流水线执行完毕，终稿已生成。")
    except Exception as error:
        st.session_state.last_error = str(error)
        progress_placeholder.empty()
        status_placeholder.error(f"流水线执行失败：{error}")


def render_empty_state() -> None:
    """Render the landing-state overview before the first run."""
    st.markdown(
        """
        <div class="column-block" style="padding:2rem; text-align:center;">
            <div style="color:#00F0FF; letter-spacing:0.2rem; text-transform:uppercase; font-size:0.8rem;">
                Pipeline Preview
            </div>
            <h3 style="margin-top:0.6rem;">夸张叙事 → 联网核查 → 可信重写</h3>
            <p style="color:#8B949E; max-width:720px; margin:0 auto 1.25rem auto;">
                这是一个黑客松演示用 Multi-Agent 新闻生产台：第一位 Agent 追求流量，
                第二位 Agent 追求证据，第三位 Agent 负责把冲突后的结果整理成可信报道。
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )


def main() -> None:
    """Render the full Streamlit application."""
    initialize_page()
    initialize_session_state()

    render_header()
    render_runtime_banner()
    topic, start_clicked = render_control_panel()
    render_metric_strip(st.session_state.audit_report)

    if start_clicked and topic.strip():
        run_pipeline(topic.strip())
    elif start_clicked:
        st.warning("请先输入一个新闻主题。")

    statuses = build_stage_statuses(
        has_draft=bool(st.session_state.draft),
        has_audit=bool(st.session_state.audit_report),
        has_final=bool(st.session_state.final_article),
    )

    if not st.session_state.draft and not st.session_state.audit_report and not st.session_state.final_article:
        render_empty_state()

    if st.session_state.last_error:
        st.error(st.session_state.last_error)

    col1, col2, col3 = st.columns(3, gap="large")
    with col1:
        render_draft_panel(st.session_state.draft, statuses["reporter"])
    with col2:
        render_audit_panel(st.session_state.audit_report, statuses["checker"])
    with col3:
        render_final_panel(st.session_state.last_topic, st.session_state.final_article, statuses["editor"])

    if st.session_state.final_article:
        with st.expander("查看 Audit Report JSON"):
            st.code(
                json.dumps(st.session_state.audit_report, ensure_ascii=False, indent=2),
                language="json",
            )

    render_footer()


if __name__ == "__main__":
    main()
