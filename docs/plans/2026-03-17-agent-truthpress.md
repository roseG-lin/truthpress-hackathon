# Agent 求真报社 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Python multi-agent workflow with a reporter, fact checker, and editor powered by the OpenAI SDK and DuckDuckGo search.

**Architecture:** Keep the code in two modules: `agent.py` for agent classes and orchestration logic, and `tool.py` for reusable web search helpers. Use dependency injection for the LLM client and search function so the workflow is testable without network calls. Represent the audit result as structured JSON-compatible dictionaries returned by `CheckerB`.

**Tech Stack:** Python, `openai`, `duckduckgo-search`, `python-dotenv`, `unittest`

---

### Task 1: Add tool tests

**Files:**
- Modify: `tool.py`
- Create: `tests/test_tool.py`

**Step 1: Write the failing test**

Create tests for:
- returning a list of normalized search result dictionaries
- handling empty queries with `ValueError`
- converting DuckDuckGo exceptions into safe fallback results

**Step 2: Run test to verify it fails**

Run: `python -m unittest tests.test_tool -v`
Expected: FAIL because `search_web` is missing.

**Step 3: Write minimal implementation**

Implement `search_web(query, max_results=5)` in `tool.py` with result normalization.

**Step 4: Run test to verify it passes**

Run: `python -m unittest tests.test_tool -v`
Expected: PASS

### Task 2: Add agent tests

**Files:**
- Modify: `agent.py`
- Create: `tests/test_agent.py`

**Step 1: Write the failing test**

Create tests for:
- `Agent.chat()` delegating to the OpenAI client correctly
- `ReporterA.write_draft()` producing a chat call with the required prompt and temperature
- `CheckerB.run_audit()` extracting claims, invoking search for each claim, and returning structured data
- `EditorC.rewrite()` combining the draft and audit report into a final article request

**Step 2: Run test to verify it fails**

Run: `python -m unittest tests.test_agent -v`
Expected: FAIL because classes and methods are missing.

**Step 3: Write minimal implementation**

Implement the base agent, reporter, checker, and editor with injectable dependencies and structured JSON parsing helpers.

**Step 4: Run test to verify it passes**

Run: `python -m unittest tests.test_agent -v`
Expected: PASS

### Task 3: Verify integration surface

**Files:**
- Modify: `requirements.txt`

**Step 1: Ensure runtime dependencies are complete**

Confirm the project already lists:
- `openai`
- `duckduckgo-search`
- `python-dotenv`

**Step 2: Run the focused suite**

Run: `python -m unittest discover -s tests -v`
Expected: PASS

**Step 3: Hand off**

Summarize public APIs:
- `tool.search_web`
- `agent.Agent`
- `agent.ReporterA`
- `agent.CheckerB`
- `agent.EditorC`
