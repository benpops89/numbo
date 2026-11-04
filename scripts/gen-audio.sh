#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/audio
python3 - <<'PY'
import subprocess, os
with open('scripts/phrases.tsv') as f:
    for line in f:
        line=line.rstrip('\n')
        if not line.strip():
            continue
        parts=line.split('\t',1)
        num=parts[0].strip()
        phrase=parts[1].strip() if len(parts)>1 else ''
        text=f"{phrase}, {num}"
        tmp='/tmp/_tts.txt'
        with open(tmp,'w') as tf:
            tf.write(text)
        out=f'public/audio/{num}.wav'
        subprocess.run(['ffmpeg','-y','-f','lavfi','-i',f'flite=textfile={tmp}:voice=slt','-af','aresample=22050',out],
                      stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        print('generated', out)
PY
echo "done: $(ls public/audio/*.wav | wc -l) files"