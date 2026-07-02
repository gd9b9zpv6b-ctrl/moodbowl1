"""Generate cute mascot illustrations for each emotion using Gemini Nano Banana.

Runs once and saves PNGs to /app/frontend/assets/emotions/<key>.png.

We use a fixed style prompt to keep the whole set visually consistent, matching
the user-provided rice-bowl reference (kawaii bowl mascot, flat pastel bg,
rounded shapes, tiny arms/legs, blush cheeks, no text). Every emotion is a
different themed character with its own healing pastel background color.
"""
from __future__ import annotations

import asyncio
import base64
import os
from pathlib import Path

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage


load_dotenv(Path(__file__).parent / ".env")

OUT_DIR = Path("/app/frontend/assets/emotions")
OUT_DIR.mkdir(parents=True, exist_ok=True)

STYLE = (
    "Cute chibi kawaii mascot illustration, flat vector cartoon style, "
    "single centered character with tiny stubby arms and legs and a simple "
    "expressive face with dot eyes and small blush cheeks, thick soft outlines, "
    "smooth gradients, no text, no letters, no watermark, no border, "
    "square 1:1 composition, subtle drop shadow beneath the character, "
    "warm friendly children's book vibe, plenty of empty space around the character."
)


EMOTIONS = [
    ("happy", "a smiling orange bowl of fluffy rice with chopsticks and a wooden spoon, arms up cheering", "soft mint green"),
    ("content", "a plump warm mug of chamomile tea with a small steam swirl and a gentle closed-eye smile", "sage green"),
    ("grateful", "a soft pink heart-shaped pillow character hugging itself with a small sparkle", "blush pink"),
    ("hopeful", "a tiny yellow sun with a soft smile peeking from behind a fluffy cloud", "pale sky blue"),
    ("calm", "a small round pastel lake character with a lily pad on its head, eyes closed", "sea foam mint"),
    ("peaceful", "a plump crescent moon character sleeping softly with a tiny star nearby", "misty lavender"),
    ("loved", "two little rose-colored heart characters holding hands", "cotton candy pink"),
    ("proud", "a small round gold trophy mascot with tiny arms raised, a soft sparkle", "buttery cream"),
    ("sad", "a soft blue raincloud character with a single teardrop and gentle downturned smile", "powder blue"),
    ("lonely", "a small pale-blue paper boat character floating on gentle waves, looking left", "hazy blue"),
    ("empty", "a plain round pale cream marshmallow character with a tiny blank expression", "warm ivory"),
    ("numb", "a soft grey rounded stone character with half-closed sleepy eyes", "dove grey"),
    ("exhausted", "a tiny lavender battery character laying on its side with a low-charge indicator", "soft lilac"),
    ("restless", "a cheerful peach-colored spinning top character mid-wobble with motion swirls", "peach cream"),
    ("anxious", "a jittery pale-orange leaf character with wavy edges and worried eyes", "buttermilk yellow"),
    ("worried", "a small beige knotted-yarn ball character with slightly furrowed brow", "oatmeal beige"),
    ("overwhelmed", "a small coral mochi character carrying a tall stack of tiny colored blocks on its head", "muted coral"),
    ("insecure", "a shy pastel-purple mushroom character partially hiding under its own cap", "pale mauve"),
    ("frustrated", "a small red tomato character with a tiny cartoon steam puff above its head", "warm blush red"),
    ("angry", "a small chili-pepper character with a slight red glow around it, tiny frown", "soft rose"),
]


async def generate_one(key: str, subject: str, bg_hint: str) -> None:
    out = OUT_DIR / f"{key}.png"
    if out.exists() and out.stat().st_size > 5000:
        print(f"[skip] {key} already exists")
        return

    prompt = (
        f"{STYLE} Subject: {subject}. Background: a solid {bg_hint} pastel color, "
        f"absolutely no text or Chinese/Japanese/English characters anywhere in the image."
    )

    chat = LlmChat(
        api_key=os.environ["EMERGENT_LLM_KEY"],
        session_id=f"emotion-{key}",
        system_message="You generate a single cute mascot illustration.",
    ).with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])

    text, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
    if not images:
        print(f"[fail] {key}: no image returned. text={text[:120] if text else ''!r}")
        return
    img = images[0]
    out.write_bytes(base64.b64decode(img["data"]))
    print(f"[ok]   {key}  ->  {out} ({out.stat().st_size // 1024} KB)")


async def main() -> None:
    for key, subject, bg in EMOTIONS:
        try:
            await generate_one(key, subject, bg)
        except Exception as exc:
            print(f"[err]  {key}: {exc}")


if __name__ == "__main__":
    asyncio.run(main())
