"""Regenerate the emotion mascot family.

Each icon shares the same underlying rice-bowl character (chubby ceramic
bowl of rice with tiny stubby arms & legs, dot eyes, blush cheeks) so the
set stays a coherent family, but the bowl color, rice amount and props
vary per emotion so every mascot has its own personality — ready for merch.

Run: `python /app/backend/generate_emotion_icons.py`
Script skips PNGs that already exist. Delete a file to regenerate just it.
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
    # grateful — heart-shaped bowl, hands pressed together
    ("grateful",     "soft blush pink (the entire bowl is shaped like a heart with a pointed bottom and two rounded lobes on top)",
     RICE_FULL,
     "showing a soft smile with both tiny hands pressed together in a thank-you gesture, tiny pink sparkle dots and one small heart floating around",
     "warm rose pink"),
    ("hopeful",      "pale morning blue",               RICE_FULL,
     "showing a hopeful upward gaze and gentle smile, a LARGE bright cheerful cartoon sun with a smiling face rising up from behind the top of the bowl — the sun should be sized about as big as the bowl itself, with several wavy sunshine rays extending out",
     "pale sky blue"),
    ("calm",         "sage green",                      RICE_FULL,
     "with peacefully closed eyes and a serene tiny smile, a single small green leaf resting neatly on top of the rice",
     "sea foam mint"),
    # peaceful — leaning against / sitting inside a large crescent moon
    ("peaceful",     "soft lavender purple",            RICE_FULL,
     "actually SITTING inside a large soft pastel cream-colored CRESCENT MOON that curves around behind the bowl like a hammock or cradle, the bowl leaning back gently against the inside curve of the moon; the bowl is sleeping softly with a small sleepy smile and a tiny snore bubble, a couple of tiny stars floating around",
     "misty lavender"),
    # loved — TWO heart-shaped bowls filled with HEART-SHAPED rice
    ("loved",        "rose pink",
     "with a plump generously heaped mound of white rice inside where the rice mound itself is clearly shaped like a heart (with a pointed V bottom and rounded lobes on top)",
     "actually drawn as TWO identical mascots STANDING SIDE BY SIDE HOLDING HANDS: each mascot is a bowl of rice where BOTH the bowl silhouette AND the mound of rice inside are clearly HEART-SHAPED (V-bottom + two rounded lobes). Both mascots have small heart-shaped smiling mouths and blushing cheeks; three tiny floating pink hearts between them",
     "cotton candy pink"),
    ("proud",        "shiny gold",                      RICE_HEAP,
     "with a confident wide grin, one little arm raised holding a tiny golden star, a tiny sparkle above its head",
     "buttery cream"),

    # ---- Sadness / low energy ----
    # sad — heart-shaped bowl with a visible crack + teardrop
    ("sad",          "deep dusty blue (the entire bowl is shaped like a heart with a jagged CRACK line running down the middle of the heart)",
     RICE_HALF,
     "with a small downturned mouth and one big shiny teardrop under one eye; the heart-shaped bowl has an obvious dark crack line across it",
     "powder blue"),
    # lonely — visible sigh puff of breath
    ("lonely",       "muted sage grey-green",           RICE_HALF,
     "sitting with arms lowered and a lonely quiet expression, mouth slightly open in a small o-shape releasing a VISIBLE PUFF OF PALE WHITE BREATH / SIGH CLOUD directly in front of its mouth (a small rounded fluffy puff, clearly visible); a tiny paper boat floating nearby on gentle wavy lines",
     "misty pale seafoam"),
    # empty — hollow-eyed vacant stare
    ("empty",        "bone white cream",                RICE_TINY,
     "with a HOLLOW VACANT expression: both eyes drawn as small empty circles (just outlines, like empty rings, no filled black pupils) staring into nothing, mouth slightly open in a small droopy o-shape. No accessories. The rice inside is almost gone, only a few grains at the bottom",
     "warm ivory cream"),
    ("numb",         "muted stone grey",                RICE_LOW,
     "with half-closed sleepy tired eyes and a straight flat mouth, one tiny grey wispy cloud drifting around it",
     "dove grey"),
    # exhausted — bowl LYING DOWN on its side sleeping
    ("exhausted",    "washed-out mauve purple",         RICE_LOW,
     "shown LYING DOWN on its side sideways on the ground as if collapsed asleep, both little arms and legs relaxed limply, eyes closed with two X shapes, a small Z Z Z sleep symbol above its head; some rice grains gently spilled out around it",
     "soft lilac"),

    # ---- Nervous / tense ----
    # restless slot → repurposed to describe 不知所措 (at a loss / clueless)
    ("restless",     "soft butter yellow",              RICE_FULL,
     "with a helpless dazed expression: eyes wide open, mouth slightly open in a small o-shape, both tiny stubby hands lifted upward and outward in a confused shrug gesture, palms open. Two or three tiny black question marks '?' floating around its head",
     "warm cream yellow"),
    # NEW: irritable — chili on head, BIGGER chili, red steam
    ("irritable",    "burnt sienna orange",             RICE_FULL,
     "with an irritable frown and slightly furrowed brows, a LARGE bright red chili pepper the size of half the bowl balanced on top of the rice, small red steam puffs rising from around the chili",
     "warm salmon orange"),
    ("anxious",      "pale butter yellow",              RICE_FULL,
     "with worried curved eyebrows, small dot eyes looking sideways, one big sweat drop on the side of the bowl, a couple of tiny nervous squiggle marks around the head",
     "buttermilk yellow"),
    ("worried",      "warm oatmeal beige",              RICE_FULL,
     "with slightly furrowed brows and a small frown, one tiny arm raised touching the side of the bowl as if thinking anxiously",
     "oatmeal beige"),
    # overwhelmed — BIG stones piled on top (not blocks)
    ("overwhelmed",  "muted coral",                     RICE_HEAP,
     "with a strained overwhelmed expression, small spirals in the eyes and a tiny grimace; balancing a wobbling stack of THREE BIG rounded grey pebble stones (each stone almost as tall as the bowl itself) piled precariously on top of its head",
     "muted salmon"),
    # NEW: trapped — inside a small birdcage with vertical bars
    ("trapped",      "cool teal blue",                  RICE_HALF,
     "sitting INSIDE a small round metal birdcage with clear vertical dark grey bars around the character (bars must be visible in front of and behind the bowl); with a small sad worried expression, one tiny hand gripping one of the bars",
     "soft grey blue"),

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
    # unappreciated — SITTING down, holding a star hopelessly, second bowl looking away
    ("unappreciated","pale lilac",                      RICE_FULL,
     "SITTING on the ground with legs stretched out in front, one tiny hand lifted up holding a tiny gold medal star hoping to be noticed, small sad quiet expression; a SECOND smaller identical rice-bowl mascot stands in the background clearly TURNED AWAY facing the other direction, ignoring the main character; a small sad sigh dot above the main character's head",
     "pale lilac"),
    ("disrespected", "warm terracotta peach",           RICE_HALF,
     "with eyes looking a bit down and slightly furrowed brows, one tiny arm crossed defensively over its front, a tiny downward arrow behind it",
     "warm peach"),
    # invisible — sitting looking down at own toes
    ("invisible",    "ghost pale blue-grey (very translucent, semi see-through)", RICE_LOW,
     "shown drawn semi-transparent and ghost-like with a very faint outline; sitting on the ground cross-legged, head bowed low looking straight down at its own tiny stubby toes, a small quiet resigned expression",
     "cool grey blue"),
    # rejected — X eyes + o mouth + big red X across bowl
    ("rejected",     "warm apricot orange",             RICE_HALF,
     "with both eyes drawn as small X shapes (crossed-out eyes) and mouth open in a shocked o-shape; a LARGE bold bright red X mark drawn diagonally right across the front of the bowl covering most of it, like a stamp of rejection",
     "warm apricot"),
    ("abandoned",    "faded teal blue",                 RICE_LOW,
     "sitting alone on the ground with tiny footprints of another character walking away in the background",
     "faded aqua"),
    ("misunderstood","soft dusty purple",               RICE_FULL,
     "with a small confused frown, a tiny speech bubble containing a small tangled scribble above its head",
     "soft lavender"),
    # NEW: unfair (唔公平) — witnessing an unjust situation
    ("unfair",       "cool slate blue",                 RICE_HALF,
     "with both tiny hands raised palms-up in an exasperated 'why?!' gesture, a small indignant frustrated frown; next to the bowl is a small unbalanced tilting scale / weighing balance where one pan is empty going up and one pan is heavy going down, clearly out of balance; a tiny exclamation mark above its head",
     "cool grey blue"),
    # guilty — deeply bowing / apologizing, hands together in front
    ("guilty",       "soft mustard yellow",             RICE_HALF,
     "bowing its head DEEPLY DOWN low toward the ground in a heartfelt apology, both tiny stubby hands pressed together in front of the bowl in a sorry gesture, eyes closed with a small regretful downturned mouth, a small dark cloud raincloud with a tiny raindrop floating above its bowed head",
     "pale mustard"),
    ("ashamed",      "dusty coral pink",                RICE_LOW,
     "with both little hands covering its face, only tiny pink blushing cheeks peeking through, tiny embarrassment lines around its head",
     "dusty coral"),
    ("hopeless",     "muted storm grey",                RICE_TINY,
     "SITTING on the ground with legs stretched out limply in front, both tiny arms resting weakly on its legs, eyes closed and small resigned downturned mouth, head slumped slightly forward. A single heavy dark grey cloud floating just above its head, muted washed-out colors",
     "storm grey"),

    # ---- Anger / intense ----
    # frustrated — sitting cross-legged with arms crossed and sighing
    ("frustrated",   "muted taupe grey-brown",          RICE_LOW,
     "SITTING on the ground cross-legged with both little stubby legs folded in front, both little arms crossed firmly across its front, a small tired sighing mouth and half-lidded eyes, a small grey deflated sigh puff cloud drifting up from its head",
     "warm sandy beige"),
    # angry — puffed red cheeks + hands on hips + frown
    ("angry",        "bright hot red",                  RICE_FULL,
     "with puffed slightly red cheeks, a small pouty grumpy frown, both tiny hands firmly on its hips like it is upset; a couple of small red anger cross marks and tiny steam puffs from the sides of its head",
     "warm blush red"),
    ("furious",      "fiery scarlet red",               RICE_HEAP,
     "with fiery angry v-shaped eyebrows and a wide open shouting mouth, both little arms raised in the air clenched, a large red steam explosion and a small orange fire flame bursting from the top of the rice",
     "warm coral"),
    # in-pain — LYING DOWN on side, hugging itself, tears
    ("in-pain",      "deep muted rose",                 RICE_LOW,
     "shown LYING DOWN on its side sideways on the ground, curled up hugging itself with both tiny arms wrapped tightly around its front, both eyes tightly shut with tears rolling out and a small wincing pained mouth, a small white bandage on the side of the bowl",
     "muted rose"),
    # in-agony — FRYING PAN with rice being pan-fried, fire underneath
    ("in-agony",     "black cast-iron frying pan with a wooden handle sticking out to the side (NOT a ceramic bowl this time — a shallow FRYING PAN skillet)",
     "with a small pile of rice being fried inside the pan (not filled like a bowl)",
     "the frying-pan mascot has two round dot eyes, small blush cheeks, and a suffering tightly shut eyes and open trembling silent-scream mouth; several bright orange and yellow FIRE flames dancing directly UNDERNEATH the pan; a couple of tiny sweat drops around its head",
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
