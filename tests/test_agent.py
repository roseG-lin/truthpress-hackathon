import json
import os
import unittest
from unittest.mock import patch

import agent
import agents


class FakeOpenAIClient:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []
        self.chat = self.ChatNamespace(self)

    class ChatNamespace:
        def __init__(self, outer):
            self.completions = FakeOpenAIClient.CompletionsNamespace(outer)

    class CompletionsNamespace:
        def __init__(self, outer):
            self.outer = outer

        def create(self, **kwargs):
            self.outer.calls.append(kwargs)
            content = self.outer.responses.pop(0)
            return type(
                "FakeResponse",
                (),
                {
                    "choices": [
                        type(
                            "Choice",
                            (),
                            {
                                "message": type(
                                    "Message",
                                    (),
                                    {
                                        "content": content,
                                    },
                                )()
                            },
                        )()
                    ]
                },
            )()


class AgentWorkflowTests(unittest.TestCase):
    def test_compatibility_module_reexports_real_agents(self):
        self.assertIs(agents.ReporterA, agent.ReporterA)
        self.assertIs(agents.CheckerB, agent.CheckerB)
        self.assertIs(agents.EditorC, agent.EditorC)

    def test_runtime_settings_prefer_deepseek_env(self):
        with patch.dict(
            os.environ,
            {
                "DEEPSEEK_API_KEY": "deepseek-key",
                "DEEPSEEK_BASE_URL": "https://api.deepseek.com",
                "OPENAI_API_KEY": "openai-key",
                "OPENAI_BASE_URL": "https://api.openai.com/v1",
            },
            clear=False,
        ):
            settings = agent.get_runtime_settings()

        self.assertEqual(settings["api_key"], "deepseek-key")
        self.assertEqual(settings["base_url"], "https://api.deepseek.com")
        self.assertEqual(settings["provider"], "DeepSeek")
        self.assertEqual(settings["model"], "deepseek-chat")

    def test_agent_chat_delegates_to_client(self):
        client = FakeOpenAIClient(["hello world"])
        instance = agent.Agent(client=client, model="gpt-test", temperature=0.2)

        result = instance.chat([{"role": "user", "content": "Hi"}])

        self.assertEqual(result, "hello world")
        self.assertEqual(client.calls[0]["model"], "gpt-test")
        self.assertEqual(client.calls[0]["temperature"], 0.2)
        self.assertEqual(client.calls[0]["messages"][0]["content"], "Hi")

    def test_chat_json_requests_json_object_mode(self):
        client = FakeOpenAIClient(['{"ok": true}'])
        instance = agent.Agent(client=client, model="gpt-test", temperature=0.2)

        result = instance.chat_json([{"role": "user", "content": "Return JSON"}])

        self.assertEqual(result, '{"ok": true}')
        self.assertEqual(client.calls[0]["response_format"], {"type": "json_object"})

    def test_reporter_generates_exaggerated_draft_prompt(self):
        client = FakeOpenAIClient(["draft article"])
        reporter = agent.ReporterA(client=client, model="gpt-test")

        draft = reporter.write_draft("OpenAI 最新发布")

        self.assertEqual(draft, "draft article")
        self.assertEqual(client.calls[0]["temperature"], 0.9)
        self.assertIn("追求流量的实习记者", client.calls[0]["messages"][0]["content"])
        self.assertIn("3个具体观点", client.calls[0]["messages"][0]["content"])
        self.assertIn("OpenAI 最新发布", client.calls[0]["messages"][1]["content"])

    def test_checker_runs_claim_extraction_search_and_verdicts(self):
        llm_outputs = [
            json.dumps(
                {
                    "claims": [
                        {"claim": "Claim A", "search_query": "query a"},
                        {"claim": "Claim B", "search_query": "query b"},
                        {"claim": "Claim C", "search_query": "query c"},
                    ]
                }
            ),
            json.dumps({"verdict": "true", "reason": "Evidence supports claim."}),
            json.dumps({"verdict": "false", "reason": "Evidence contradicts claim."}),
            json.dumps({"verdict": "true", "reason": "Multiple sources agree."}),
        ]
        client = FakeOpenAIClient(llm_outputs)
        seen_queries = []

        def fake_search(query, max_results=5):
            seen_queries.append((query, max_results))
            return [
                {"title": f"Loose result {query}", "url": "https://noise.example.com", "snippet": "noise"},
                {"title": f"Result for {query}", "url": f"https://example.com/{query}", "snippet": f"{query} snippet"},
            ]

        checker = agent.CheckerB(client=client, model="gpt-test", search_func=fake_search)

        report = checker.run_audit("Draft body")

        self.assertEqual(report["summary"]["total_claims"], 3)
        self.assertEqual(report["summary"]["true_claims"], 2)
        self.assertEqual(report["summary"]["false_claims"], 1)
        self.assertEqual([item["claim"] for item in report["items"]], ["Claim A", "Claim B", "Claim C"])
        self.assertEqual(seen_queries, [("query a", 5), ("query b", 5), ("query c", 5)])
        self.assertEqual(report["items"][0]["search_query"], "query a")
        self.assertEqual(report["items"][0]["source"], "https://example.com/query a")
        self.assertEqual(client.calls[0]["response_format"], {"type": "json_object"})
        self.assertEqual(client.calls[1]["response_format"], {"type": "json_object"})

    def test_checker_falls_back_to_local_query_cleanup(self):
        llm_outputs = [
            json.dumps({"claims": ["Coffee definitely causes instant DNA collapse in every human!"]}),
            json.dumps({"verdict": "uncertain", "reason": "Insufficient evidence."}),
        ]
        client = FakeOpenAIClient(llm_outputs)
        seen_queries = []

        def fake_search(query, max_results=5):
            seen_queries.append(query)
            return [{"title": "Coffee study", "url": "https://example.com/study", "snippet": "coffee dna study"}]

        checker = agent.CheckerB(client=client, model="gpt-test", search_func=fake_search)

        report = checker.run_audit("Draft body")

        self.assertEqual(report["items"][0]["claim"], "Coffee definitely causes instant DNA collapse in every human!")
        self.assertEqual(report["items"][0]["search_query"], "Coffee causes DNA human")
        self.assertEqual(seen_queries, ["Coffee causes DNA human"])

    def test_editor_combines_draft_and_audit_report(self):
        client = FakeOpenAIClient(["final article"])
        editor = agent.EditorC(client=client, model="gpt-test")
        audit_report = {
            "summary": {"total_claims": 1, "true_claims": 1, "false_claims": 0},
            "items": [{"claim": "Claim A", "verdict": "true", "reason": "Supported", "evidence": []}],
        }

        result = editor.rewrite("Original draft", audit_report)

        self.assertEqual(result, "final article")
        self.assertIn("根据 draft 和 audit report", client.calls[0]["messages"][0]["content"])
        self.assertIn("Original draft", client.calls[0]["messages"][1]["content"])
        self.assertIn("Claim A", client.calls[0]["messages"][1]["content"])


if __name__ == "__main__":
    unittest.main()
