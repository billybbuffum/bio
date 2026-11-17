"""Offline tests: no API key, no network.

A fake HTTP transport stands in for the Jev server. The numbers it returns are
invented for the test; they show the policy code reacting to them, not how the
real model would judge these answers.

Run:  python -m pytest test_grader.py
"""

import json

import httpx2
import pytest
from typesafe_sdk import TypeSafeClient

from grader import QUESTIONS, grade

RUBRIC = dict(enumerate(QUESTIONS["quality"].criteria))
LABELS = list(QUESTIONS["misconception"].criteria)


def fake_jev(*, is_attempt, direction, label, label_conf, score, score_conf, seen=None):
    """Build a client whose 'server' always replies with these answers."""

    def handler(request: httpx2.Request) -> httpx2.Response:
        if seen is not None:
            seen.append(json.loads(request.content))
        rest = (1 - label_conf) / (len(LABELS) - 1)
        return httpx2.Response(
            200,
            json={
                "model": "jev-test",
                "usage": {"input_tokens": 100, "output_tokens": 4},
                "answers": {
                    "is_attempt": {"type": "noul", "noul": is_attempt},
                    "direction_correct": {"type": "noul", "noul": direction},
                    "misconception": {
                        "type": "choice",
                        "choice": label,
                        "confidence": label_conf,
                        "probabilities": {name: (label_conf if name == label else rest) for name in LABELS},
                    },
                    "quality": {
                        "type": "score",
                        "score": score,
                        "confidence": score_conf,
                        "legend": {str(level): text for level, text in RUBRIC.items()},
                        "probabilities": {str(level): 1 / len(RUBRIC) for level in RUBRIC},
                    },
                },
            },
        )

    return TypeSafeClient(api_key="test-key", transport=httpx2.MockTransport(handler))


CASES = {
    "confident and correct": (
        dict(is_attempt=0.99, direction=0.97, label="none", label_conf=0.9, score=2.9, score_conf=0.9),
        dict(points=3, needs_human=False),
    ),
    "clear misconception": (
        dict(is_attempt=0.98, direction=0.05, label="solute_moves", label_conf=0.85, score=0.8, score_conf=0.8),
        dict(points=1, needs_human=False),
    ),
    "not an attempt": (
        dict(is_attempt=0.03, direction=0.02, label="other", label_conf=0.9, score=0.1, score_conf=0.95),
        dict(points=0, needs_human=False),
    ),
    "model unsure of the score": (
        dict(is_attempt=0.95, direction=0.9, label="none", label_conf=0.5, score=1.6, score_conf=0.4),
        dict(points=None, needs_human=True),
    ),
    "direction is a coin flip": (
        dict(is_attempt=0.95, direction=0.5, label="other", label_conf=0.7, score=2.1, score_conf=0.8),
        dict(points=None, needs_human=True),
    ),
    "judgements contradict each other": (
        dict(is_attempt=0.95, direction=0.1, label="none", label_conf=0.8, score=2.8, score_conf=0.9),
        dict(points=None, needs_human=True),
    ),
}


@pytest.mark.parametrize("name", CASES)
def test_policy(name):
    answers, expected = CASES[name]
    with fake_jev(**answers) as client:
        verdict = grade(client, "any answer")
    assert verdict.points == expected["points"]
    assert verdict.needs_human == expected["needs_human"]


def test_feedback_follows_the_misconception_label():
    answers, _ = CASES["clear misconception"]
    with fake_jev(**answers) as client:
        assert "water moves, not the solute" in grade(client, "salt moves").feedback


def test_request_on_the_wire():
    """What actually gets POSTed to /v1/systemone."""
    seen = []
    answers, _ = CASES["confident and correct"]
    with fake_jev(**answers, seen=seen) as client:
        grade(client, "Water moves toward more solute.")

    (body,) = seen
    assert body["state"]["student_answer"] == "Water moves toward more solute."
    assert {name: q["type"] for name, q in body["questions"].items()} == {
        "is_attempt": "noul",
        "direction_correct": "noul",
        "misconception": "choice",
        "quality": "score",
    }
    assert len(body["questions"]["quality"]["criteria"]) == 4
