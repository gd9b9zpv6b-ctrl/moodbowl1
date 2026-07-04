"""Emergent push notification relay.

Do NOT edit `EMERGENT_PUSH_KEY` in `.env` — the deployment pipeline injects the real key
at build time. Locally it stays as `"placeholder"` so imports don't crash · the code
gracefully handles a missing/invalid key by logging and returning early.
"""
import logging
import os
from typing import Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

PUSH_BASE_URL = "https://integrations.emergentagent.com"
PUSH_KEY = os.environ.get("EMERGENT_PUSH_KEY", "placeholder")

# Shared client · lazily-instantiated to avoid failing at import time
_client: Optional[httpx.AsyncClient] = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(
            base_url=PUSH_BASE_URL,
            headers={"X-Push-Key": PUSH_KEY},
            timeout=10.0,
        )
    return _client


async def register_device(user_id: str, platform: str, device_token: str) -> dict:
    """Register a device with the upstream push relay."""
    client = _get_client()
    resp = await client.post(
        "/api/v1/push/users/register",
        json={"user_id": user_id, "platform": platform, "device_token": device_token},
    )
    if resp.status_code == 401:
        raise RuntimeError("EMERGENT_PUSH_KEY missing or invalid")
    resp.raise_for_status()
    return {"status": "registered"}


async def send_push(
    recipients: list[str],
    title: str,
    message: str,
    *,
    subtext: Optional[str] = None,
    action_url: Optional[str] = None,
    idempotency_key: Optional[str] = None,
) -> None:
    """Fire-and-forget push send · non-blocking · logs on failure.
    Chunks 100-at-a-time as per upstream limit."""
    if not recipients:
        return
    if PUSH_KEY == "placeholder":
        # Locally · we don't error — just log so tests + previews don't get noisy failures.
        logger.info(
            f"[push] skipped (key=placeholder) title={title!r} recipients={len(recipients)}"
        )
        return

    data = {"title": title, "message": message}
    if subtext:
        data["subtext"] = subtext
    if action_url:
        data["action_url"] = action_url

    client = _get_client()
    for i in range(0, len(recipients), 100):
        chunk = recipients[i:i + 100]
        payload: dict = {"recipients": chunk, "data": data}
        if idempotency_key:
            payload["$idempotency_key"] = f"{idempotency_key}-{i}"
        try:
            resp = await client.post("/api/v1/push/trigger", json=payload)
            if resp.status_code >= 400:
                logger.warning(f"[push] {resp.status_code} — {resp.text[:200]}")
        except Exception as e:
            logger.warning(f"[push] send failed (non-blocking): {e}")
