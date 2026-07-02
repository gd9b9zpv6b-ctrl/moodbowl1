"""Regenerate the emotion mascot family.

Every icon shares the same underlying rice-bowl character (chubby ceramic
bowl of rice with tiny stubby arms & legs, dot eyes, blush cheeks) so the
set stays a coherent family, but the bowl color and rice amount now vary
per emotion so each mascot has its own personality — perfect for stickers
and merch.

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


def build_prompt(bowl_color: str, rice_level: str, expression: str, bg: str) -> str:
    return (
        "A single centered cartoon mascot: a chubby round ceramic rice bowl "
        f"in {bowl_color} color, {rice_level}. "
        "The bowl has two small stubby arms and two little stubby legs, "
        "two round black dot eyes on the bowl's front, and small round pink "
        "blush cheeks. Very cute chibi kawaii style, thick soft dark outlines, "
        "flat colors with very light soft shading, subtle drop shadow beneath "
        "the character on the ground, plenty of empty pastel space around, "
        "square 1:1 composition. "
        f"The character is {expression}. "
        f"Background: a single flat solid {bg} pastel color, no patterns. "
        "Warm friendly children's book vibe. "
        "NO text of any language, no letters, no Chinese/Japanese/English "
        "characters, no logo, no watermark, no border."
    )


# Rice level presets ----------------------------------------------------
RICE_HEAP = "generously heaped high with fluffy white rice mounded above the rim, with small orange rice-grain dots"
RICE_FULL = "filled to the brim with fluffy pale white rice, with small orange rice-grain dots visible"
RICE_HALF = "about half-full with fluffy pale white rice, a bit lower than the rim"
RICE_LOW  = "with just a small mound of fluffy pale white rice at the bottom, mostly empty inside"
RICE_TINY = "nearly empty, with only a tiny scattering of rice grains at the bottom of the bowl"


# (key, bowl_color, rice_level, expression, background_color) --------------
EMOTIONS = [
    # ---- Warm / positive ----
    ("happy",        "warm sunshine yellow",            RICE_HEAP,
     "showing a big bright cheerful smile, both little arms raised up in a joyful cheer; two thin wooden chopsticks stuck into the rice on the left side and a small wooden spoon on the right side",
     "soft mint green"),
    ("content",      "warm terracotta orange",          RICE_FULL,
     "showing a gentle satisfied closed-eye smile, a small curl of white steam rising from the rice",
     "sage green"),
    ("grateful",     "soft blush pink",                 RICE_FULL,
     "showing a soft smile with both tiny hands pressed together in a thank-you gesture, tiny pink sparkle dots floating around",
     "warm blush pink"),
    ("hopeful",      "pale morning blue",               RICE_FULL,
     "showing a hopeful upward gaze and gentle smile, a tiny sunshine peeking from behind the top of the bowl with soft rays",
     "pale sky blue"),
    ("calm",         "sage green",                      RICE_FULL,
     "with peacefully closed eyes and a serene tiny smile, a single small green leaf resting neatly on top of the rice",
     "sea foam mint"),
    ("peaceful",     "soft lavender purple",            RICE_FULL,
     "sleeping softly with a small sleepy smile and a tiny snore bubble, a small crescent moon and one tiny star floating beside it",
     "misty lavender"),
    ("loved",        "rose pink",                       RICE_HEAP,
     "with a small heart-shaped smiling mouth, extra pink blushing cheeks, three tiny pink hearts floating around the bowl",
     "cotton candy pink"),
    ("proud",        "shiny gold",                      RICE_HEAP,
     "with a confident wide grin, one little arm raised holding a tiny golden star, a tiny sparkle above its head",
     "buttery cream"),

    # ---- Sadness / low energy ----
    ("sad",          "dusty muted blue",                RICE_HALF,
     "with a small downturned mouth and one big shiny teardrop under one eye, a tiny grey raincloud floating above the bowl with a couple of raindrops",
     "powder blue"),
    ("lonely",       "faded slate blue",                RICE_HALF,
     "sitting with arms lowered and looking sideways with a lonely quiet expression, a tiny paper boat floating on gentle wavy lines next to the bowl",
     "hazy pale blue"),
    ("empty",        "bone white cream",                RICE_TINY,
     "with a completely blank flat straight-line mouth and simple dot eyes, no accessories, the rice inside is almost gone",
     "warm ivory cream"),
    ("numb",         "muted stone grey",                RICE_LOW,
     "with half-closed sleepy tired eyes and a straight flat mouth, one tiny grey wispy cloud drifting around it",
     "dove grey"),
    ("exhausted",    "washed-out mauve",                RICE_LOW,
     "with two X-shaped closed eyes and a small tired open mouth, both little arms drooping down, a tiny sweat drop and a small puff of steam floating up",
     "soft lilac"),

    # ---- Nervous / tense ----
    ("restless",     "warm peach",                      RICE_FULL,
     "with wide alert eyes, a small worried o-shaped mouth, tiny motion swirls and wobble lines around the bowl as if it cannot sit still",
     "peach cream"),
    ("anxious",      "pale butter yellow",              RICE_FULL,
     "with worried curved eyebrows, small dot eyes looking sideways, one big sweat drop on the side of the bowl, a couple of tiny nervous squiggle marks around the head",
     "buttermilk yellow"),
    ("worried",      "warm oatmeal beige",              RICE_FULL,
     "with slightly furrowed brows and a small frown, one tiny arm raised touching the side of the bowl as if thinking anxiously",
     "oatmeal beige"),
    ("overwhelmed",  "muted coral",                     RICE_HEAP,
     "with a slightly overwhelmed dizzy expression (small spirals in the eyes), a tall wobbly stack of three tiny colored blocks balanced on top of the heaping rice",
     "muted coral"),

    # ---- Self-worth wounds ----
    ("worthless",    "dull periwinkle grey-blue",       RICE_TINY,
     "with a resigned neutral flat mouth and eyes looking down at itself, one tiny arm limply pointing at itself, a tiny question mark floating over its head",
     "muted periwinkle"),
    ("insecure",     "shy dusty mauve",                 RICE_LOW,
     "in a shy pose with both tiny hands raised halfway to cover its face, only one dot eye peeking out, cheeks extra pink",
     "pale mauve"),
    ("unloved",      "faded dusty rose",                RICE_LOW,
     "sitting with head slightly lowered and eyes downcast, holding a tiny grey cracked/broken heart in its two little hands",
     "dusty rose"),
    ("unappreciated","pale lilac",                      RICE_FULL,
     "holding up a tiny gold star / medal in its hand but the head is turned sideways as if no one is looking, a small sigh dot above the head",
     "pale lilac"),
    ("disrespected", "warm terracotta peach",           RICE_HALF,
     "with eyes looking a bit down and slightly furrowed brows, one tiny arm crossed defensively over its front, a tiny downward arrow behind it",
     "warm peach"),
    ("invisible",    "ghost pale blue-grey (very translucent)", RICE_LOW,
     "drawn semi-transparent and ghost-like with a very faint outline, a small quiet sad expression",
     "cool grey blue"),
    ("rejected",     "warm apricot orange",             RICE_HALF,
     "turned slightly away with a small sad expression, a tiny closed door with a small X mark nearby",
     "warm apricot"),
    ("abandoned",    "faded teal blue",                 RICE_LOW,
     "sitting alone on the ground with tiny footprints of another character walking away in the background",
     "faded aqua"),
    ("misunderstood","soft dusty purple",               RICE_FULL,
     "with a small confused frown, a tiny speech bubble containing a small tangled scribble above its head",
     "soft lavender"),
    ("guilty",       "pale mustard yellow",             RICE_HALF,
     "looking down with a small worried frown, one tiny arm hiding its face partially, a small dark cloud with a tiny raindrop above it",
     "pale mustard"),
    ("ashamed",      "dusty coral pink",                RICE_LOW,
     "with both little hands covering its face, only tiny pink blushing cheeks peeking through, tiny embarrassment lines around its head",
     "dusty coral"),
    ("hopeless",     "muted storm grey",                RICE_TINY,
     "with eyes closed and a small resigned downturned mouth, a single heavy dark grey cloud floating above the head, muted washed-out colors",
     "storm grey"),

    # ---- Anger / intense ----
    ("frustrated",   "warm brick red",                  RICE_FULL,
     "with puffed slightly red cheeks, a small pouty frown, both tiny hands on its hips, a small angry cross mark near its head",
     "warm blush red"),
    ("angry",        "bright red",                      RICE_HEAP,
     "with angry v-shaped eyebrows and a tiny grumpy frown, a small red steam puff rising from the top of the rice, a small red chili pepper resting on top of the rice",
     "soft warm rose"),
    ("furious",      "fiery scarlet red",               RICE_HEAP,
     "with fiery angry v-shaped eyebrows and a wide open shouting mouth, both little arms raised in the air clenched, a large red steam explosion and a small fire flame bursting from the top of the rice",
     "warm coral"),
    ("in-pain",      "deep muted rose",                 RICE_LOW,
     "hugging itself with both tiny arms crossed tight over its front, tears welling up in both eyes and a small wincing pained mouth, a small white bandage on the side of the bowl",
     "muted rose"),
    ("in-agony",     "dark dusty plum",                 RICE_TINY,
     "with tightly shut eyes and a small trembling wide-open mouth as if crying silently, a heavy dark grey cloud with tiny lightning zigzags above its head, tears streaming down its cheeks",
     "dusty plum"),
]


async def generate_one(key: str, bowl_color: str, rice_level: str, expression: str, bg: str) -> None:
    out = OUT_DIR / f"{key}.png"
    if out.exists() and out.stat().st_size > 5000:
        print(f"[skip] {key} already exists")
        return

    prompt = build_prompt(bowl_color, rice_level, expression, bg)
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
    print(f"[ok]   {key:15s} -> {out} ({out.stat().st_size // 1024} KB)")


async def main() -> None:
    for key, bowl_color, rice_level, expr, bg in EMOTIONS:
        try:
            await generate_one(key, bowl_color, rice_level, expr, bg)
        except Exception as exc:
            print(f"[err]  {key}: {exc}")


if __name__ == "__main__":
    asyncio.run(main())
