import unittest
from unittest.mock import patch

import tool
import tools


class SearchWebTests(unittest.TestCase):
    def test_compatibility_module_reexports_search_web(self):
        self.assertIs(tools.search_web, tool.search_web)

    def test_search_web_normalizes_results(self):
        fake_results = [
            {
                "title": "Example title",
                "href": "https://example.com/story",
                "body": "Example snippet",
            }
        ]

        with patch("tool.DDGS") as mock_ddgs:
            mock_ddgs.return_value.__enter__.return_value.text.return_value = fake_results

            results = tool.search_web("ai agents", max_results=3)

        self.assertEqual(
            results,
            [
                {
                    "title": "Example title",
                    "url": "https://example.com/story",
                    "snippet": "Example snippet",
                }
            ],
        )

    def test_search_web_rejects_empty_query(self):
        with self.assertRaises(ValueError):
            tool.search_web("   ")

    def test_search_web_returns_fallback_on_provider_error(self):
        with patch("tool.DDGS") as mock_ddgs:
            mock_ddgs.return_value.__enter__.return_value.text.side_effect = RuntimeError("boom")

            results = tool.search_web("failing query")

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["title"], "Search unavailable")
        self.assertIn("boom", results[0]["snippet"])

    def test_search_web_returns_fallback_when_no_results(self):
        with patch("tool.DDGS") as mock_ddgs:
            mock_ddgs.return_value.__enter__.return_value.text.return_value = []

            results = tool.search_web("rare query")

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["title"], "No search results")


if __name__ == "__main__":
    unittest.main()
