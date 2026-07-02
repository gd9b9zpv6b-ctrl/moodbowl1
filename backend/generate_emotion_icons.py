"""Regenerate cute rice-bowl mascot illustrations for each emotion.

Every emotion shares the same character (a warm peach/terracotta ceramic bowl
of fluffy white rice with tiny stubby arms, legs, dot eyes and blush cheeks —
matching the user-provided reference). Only the facial expression, tiny
accessory and background pastel change per feeling, so the full set feels like
a single coherent family.

Run: `python /app/backend/generate_emotion_icons.py`
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

BASE_CHARACTER = (
    "A single centered cartoon mascot: a chubby round ceramic rice bowl "
    "in warm peach / terracotta color, filled to the brim with fluffy pale "
    "white rice with tiny orange rice-grain dots visible. The bowl has two "
    "small stubby arms and two little stubby legs, two round black dot eyes "
    "on the bowl's front, and small round pink blush cheeks. "
    "Very cute chibi kawaii style, thick soft dark outlines, flat colors with "
    "very light soft shading, subtle drop shadow beneath the character on the "
    "ground, plenty of empty pastel space around the character, square 1:1 "
    "composition."
)

FORBID = (
    "NO text of any language, no letters, no Chinese/Japanese/English "
    "characters, no logo, no watermark, no border."
)


# (key, emotion facial + tiny accessory description, background pastel color)
EMOTIONS = [
    ("happy",       "with a big bright cheerful smile, both little arms raised up in a joyful cheer; two thin wooden chopsticks stuck into the rice on the left side and a small wooden spoon on the right side", "soft mint green"),
    ("content",     "with a gentle satisfied closed-eye smile, a small curl of white steam rising from the rice", "sage green"),
    ("grateful",    "with a soft smile, both tiny hands pressed together in front of the bowl like a small thank-you gesture, tiny pink sparkle dots floating around", "warm blush pink"),
    ("hopeful",     "with a hopeful upward gaze and gentle smile, a tiny sunshine peeking from behind the top of the bowl with soft rays", "pale sky blue"),
    ("calm",        "with peacefully closed eyes and a serene tiny smile, a single small green leaf resting on top of the rice", "sea foam mint"),
    ("peaceful",    "sleeping softly with a small sleepy smile and a tiny snore bubble, a small crescent moon and one tiny star floating beside it", "misty lavender"),
    ("loved",       "with a small heart-shaped smiling mouth, extra pink blushing cheeks, three tiny pink hearts floating around the bowl", "cotton candy pink"),
    ("proud",       "with a confident wide grin, one little arm raised holding a tiny golden star, a tiny sparkle above its head", "buttery cream"),
    ("sad",         "with a small downturned mouth and one big shiny teardrop under one eye, a tiny grey raincloud floating above the bowl with a couple of raindrops", "powder blue"),
    ("lonely",      "sitting with arms lowered and looking sideways with a lonely quiet expression, a tiny paper boat floating on gentle wavy lines next to the bowl", "hazy pale blue"),
    ("empty",       "with a completely blank flat straight-line mouth and simple dot eyes, no accessories at all, the rice looks slightly lower / more spread out", "warm ivory cream"),
    ("numb",        "with half-closed sleepy tired eyes and a straight mouth, slightly muted / greyer bowl color, one tiny grey wispy cloud around it", "dove grey"),
    ("exhausted",   "with two X-shaped closed eyes and a small tired open mouth, both little arms drooping down, a tiny sweat drop and a small puff of steam floating up", "soft lilac"),
    ("restless",    "with wide alert eyes, a small worried o-shaped mouth, tiny motion swirls / wobble lines around the bowl as if it can't sit still", "peach cream"),
    ("anxious",     "with worried curved eyebrows, small dot eyes looking sideways, one big sweat drop on the side of the bowl, a couple of tiny nervous squiggle marks around the head", "buttermilk yellow"),
    ("worried",     "with slightly furrowed brows and a small frown, one tiny arm raised touching the side of the bowl like it's thinking anxiously", "oatmeal beige"),
    ("overwhelmed", "with a slightly overwhelmed dizzy expression (small spirals in the eyes), a tall wobbly stack of three tiny colored blocks balanced on the top of the rice", "muted coral"),
    ("insecure",    "in a shy pose, both tiny hands raised halfway to cover the face, only one dot eye peeking out between the hands, cheeks extra pink", "pale mauve"),
    ("frustrated",  "with puffed slightly red cheeks, a small pouty frown, both tiny hands on its hips, a small angry cross mark near the head", "warm blush red"),
    ("angry",       "with angry v-shaped eyebrows and a tiny grumpy frown, a small red steam puff rising from the top of the rice, a small red chili pepper resting on top of the rice", "soft warm rose"),
]


async def generate_one(key: str, emotion_desc: str, bg_hint: str) -> None:
    out = OUT_DIR / f"{key}.png"

    prompt = (
        f"{BASE_CHARACTER} The character is {emotion_desc}. "
        f"Background: a single flat solid {bg_hint} pastel color, no patterns. "
        f"Warm friendly children's book vibe. {FORBID}"
    )

    chat = (
        LlmChat(
            api_key=os.environ["EMERGENT_LLM_KEY"],
            session_id=f"emotion-bowl-{key}",
            system_message="You produce a single cute mascot illustration image.",
        )
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )

    text, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
    if not images:
        print(f"[fail] {key}: no image returned. text={(text or '')[:120]!r}")
        return
    out.write_bytes(base64.b64decode(images[0]["data"]))
    print(f"[ok]   {key:11s} -> {out} ({out.stat().st_size // 1024} KB)")


async def main() -> None:
    for key, desc, bg in EMOTIONS:
        try:
            await generate_one(key, desc, bg)
        except Exception as exc:
            print(f"[err]  {key}: {exc}")


if __name__ == "__main__":
    asyncio.run(main())
