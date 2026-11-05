#!/usr/bin/env python3
"""Generate the 90 call audio files with Piper neural TTS."""
import os
import subprocess
import sys

VOICE = os.environ.get("PIPER_VOICE", "en_GB-northern_english_male-medium")
OUTDIR = "public/audio"

with open("scripts/phrases.tsv") as f:
    lines = [l.rstrip("\n") for l in f if l.strip()]

os.makedirs(OUTDIR, exist_ok=True)
tmp = "/tmp/_numbo_tts.txt"
for line in lines:
    num, phrase = (line.split("\t", 1) + [""])[:2]
    text = f"{phrase}, {num}"
    with open(tmp, "w") as tf:
        tf.write(text)
    out = f"{OUTDIR}/{num.strip()}.wav"
    subprocess.run(
        ["piper", "-m", VOICE, "-f", out, "-c", "1", "-r", "22050", "--", "-"],
        stdin=open(tmp), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True,
    )
    print(f"generated {out}")

os.remove(tmp)
print(f"done: {len(lines)} files, voice {VOICE}")
