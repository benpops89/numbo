#!/usr/bin/env python3
"""Generate the 90 call audio files with Piper neural TTS."""
import os
import subprocess
import sys

VOICE = os.environ.get("PIPER_VOICE", "en_GB-northern_english_male-medium")
OUTDIR = "public/audio"
MIN_DUR = "1.6"  # every call breathes for at least this long, seconds

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
    raw = f"/tmp/_numbo_raw_{num.strip()}.wav"
    subprocess.run(
        ["piper", "-m", VOICE, "-f", raw],
        stdin=open(tmp), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True,
    )
    # trim excess edge silence, keep a small head gap, pad so short calls breathe
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", raw,
            "-af",
            f"silenceremove=start_periods=1:start_threshold=-45dB,adelay=120,"
            f"silenceremove=stop_periods=1:stop_threshold=-45dB:stop_silence=250,apad=whole_dur={MIN_DUR}",
            out,
        ],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True,
    )
    os.remove(raw)
    print(f"generated {out}")

os.remove(tmp)
print(f"done: {len(lines)} files, voice {VOICE}")
