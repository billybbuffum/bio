"""A tiny local playground for Jev.

Serves one HTML page and two JSON endpoints that forward to the real Jev API
through the official SDK. No other dependencies.

Run:  TYPESAFE_API_KEY=... python server.py   (then open http://localhost:8000)
"""

import json
import os
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from typesafe_sdk import TypeSafeAPIError, TypeSafeClient, TypeSafeError

PAGE = Path(__file__).with_name("index.html")
PORT = int(os.environ.get("PORT", "8000"))

_client: TypeSafeClient | None = None


def client() -> TypeSafeClient:
    """Create the client lazily, so the page loads even before a key is set."""
    global _client
    if _client is None:
        # A placeholder lets the SDK start when the key is injected by a proxy instead.
        _client = TypeSafeClient(api_key=os.environ.get("TYPESAFE_API_KEY") or "proxy-injected")
    return _client


def evaluate(body: dict) -> dict:
    started = time.perf_counter()
    response = client().system_one(
        state=body["state"],
        questions=body["questions"],  # raw dicts: {"type": "noul" | "choice" | "score", ...}
        model=body.get("model") or None,
    )
    return {
        "model": response.model,
        "usage": response.usage.model_dump(),
        "latency_ms": round((time.perf_counter() - started) * 1000),
        "answers": {name: answer.model_dump(mode="json") for name, answer in response.answers.items()},
    }


def models() -> dict:
    return {"models": [m.model_dump() for m in client().models.list().models]}


class Handler(BaseHTTPRequestHandler):
    def _send(self, status: int, payload: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _json(self, status: int, data: dict) -> None:
        self._send(status, json.dumps(data).encode(), "application/json")

    def _guard(self, fn, *args) -> None:
        try:
            self._json(200, fn(*args))
        except TypeSafeAPIError as error:
            self._json(502, {"error": f"Jev API returned {error.status_code}", "detail": str(error)})
        except TypeSafeError as error:
            self._json(502, {"error": type(error).__name__, "detail": str(error)})
        except (KeyError, ValueError) as error:
            self._json(400, {"error": "Bad request", "detail": str(error)})

    def do_GET(self) -> None:
        if self.path in ("/", "/index.html"):
            self._send(200, PAGE.read_bytes(), "text/html; charset=utf-8")
        elif self.path == "/api/models":
            self._guard(models)
        else:
            self._json(404, {"error": "Not found"})

    def do_POST(self) -> None:
        if self.path != "/api/evaluate":
            return self._json(404, {"error": "Not found"})
        length = int(self.headers.get("Content-Length", 0))
        try:
            body = json.loads(self.rfile.read(length))
        except json.JSONDecodeError as error:
            return self._json(400, {"error": "Body is not JSON", "detail": str(error)})
        self._guard(evaluate, body)

    def log_message(self, fmt: str, *args) -> None:
        print(f"{self.command} {self.path} -> {args[1] if len(args) > 1 else ''}")


if __name__ == "__main__":
    print(f"Jev playground on http://localhost:{PORT}")
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
