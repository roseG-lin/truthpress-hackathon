import unittest
from pathlib import Path

import app


class AppHelperTests(unittest.TestCase):
    def test_summarize_audit_metrics_counts_verdicts(self):
        report = {
            "summary": {
                "total_claims": 3,
                "true_claims": 2,
                "false_claims": 1,
                "uncertain_claims": 0,
            }
        }

        metrics = app.summarize_audit_metrics(report)

        self.assertEqual(metrics["total"], 3)
        self.assertEqual(metrics["true"], 2)
        self.assertEqual(metrics["false"], 1)
        self.assertEqual(metrics["uncertain"], 0)
        self.assertAlmostEqual(metrics["accuracy_rate"], 66.67, places=2)

    def test_build_download_filename_sanitizes_topic(self):
        filename = app.build_download_filename("AI / 量子? 2026")

        self.assertEqual(filename, "TruthPress_AI_量子_2026.md")

    def test_stage_statuses_reflect_completed_pipeline(self):
        statuses = app.build_stage_statuses(has_draft=True, has_audit=True, has_final=True)

        self.assertEqual(statuses["reporter"], "completed")
        self.assertEqual(statuses["checker"], "completed")
        self.assertEqual(statuses["editor"], "completed")

    def test_stage_statuses_show_processing_frontier(self):
        statuses = app.build_stage_statuses(has_draft=True, has_audit=False, has_final=False)

        self.assertEqual(statuses["reporter"], "completed")
        self.assertEqual(statuses["checker"], "processing")
        self.assertEqual(statuses["editor"], "pending")

    def test_runtime_summary_formats_provider_model_and_base_url(self):
        summary = app.build_runtime_summary(
            {
                "provider": "DeepSeek",
                "model": "deepseek-chat",
                "base_url": "https://api.deepseek.com",
            }
        )

        self.assertIn("DeepSeek", summary)
        self.assertIn("deepseek-chat", summary)
        self.assertIn("https://api.deepseek.com", summary)

    def test_env_example_contains_deepseek_template(self):
        env_example = Path(".env.example")

        self.assertTrue(env_example.exists())
        content = env_example.read_text(encoding="utf-8")
        self.assertIn("DEEPSEEK_API_KEY", content)
        self.assertIn("DEEPSEEK_BASE_URL", content)


if __name__ == "__main__":
    unittest.main()
