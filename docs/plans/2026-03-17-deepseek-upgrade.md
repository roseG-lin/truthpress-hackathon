# DeepSeek Integration Upgrade Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade TruthPress to use DeepSeek via the OpenAI SDK by default and improve reliability, configuration clarity, and hackathon demo readiness.

**Architecture:** Keep the existing OpenAI-compatible SDK integration, but make the client builder DeepSeek-aware through environment-variable precedence and default base URL behavior. Improve `CheckerB` JSON extraction/judgment calls with explicit JSON mode and fallback parsing. Surface provider/model information and clearer configuration errors in the Streamlit UI. Add a `.env.example` template for quick local setup.

**Tech Stack:** Python, `openai`, `duckduckgo-search`, `python-dotenv`, `streamlit`, `unittest`

---

### Task 1: Protect DeepSeek client configuration

**Files:**
- Modify: `agent.py`
- Modify: `tests/test_agent.py`

**Step 1: Write the failing test**

Add tests for:
- preferring `DEEPSEEK_API_KEY` and `DEEPSEEK_BASE_URL`
- defaulting the model to `deepseek-chat`
- passing JSON mode for checker-specific model calls

**Step 2: Run test to verify it fails**

Run: `python -m unittest tests.test_agent -v`
Expected: FAIL because DeepSeek-specific behavior is not implemented yet.

**Step 3: Write minimal implementation**

Add environment precedence and JSON-aware chat helpers.

**Step 4: Run test to verify it passes**

Run: `python -m unittest tests.test_agent -v`
Expected: PASS

### Task 2: Improve hackathon app ergonomics

**Files:**
- Modify: `app.py`
- Modify: `tests/test_app.py`
- Create: `.env.example`

**Step 1: Write the failing test**

Add tests for:
- reporting the active provider/model summary
- preserving `.env` template defaults for DeepSeek

**Step 2: Run test to verify it fails**

Run: `python -m unittest tests.test_app -v`
Expected: FAIL because provider summary helper and config template do not exist.

**Step 3: Write minimal implementation**

Expose provider summary helpers, show setup guidance in the UI, and add `.env.example`.

**Step 4: Run test to verify it passes**

Run: `python -m unittest tests.test_app -v`
Expected: PASS

### Task 3: Verify end-to-end readiness

**Files:**
- Modify: `requirements.txt` (only if needed)

**Step 1: Run complete focused verification**

Run: `python -m unittest discover -s tests -v`
Expected: PASS

**Step 2: Run syntax/import verification**

Run: `python -m compileall agent.py tool.py app.py components\\ui_components.py`
Expected: PASS

**Step 3: Hand off**

Document:
- required DeepSeek env vars
- demo startup command
- remaining runtime dependency to install if missing
