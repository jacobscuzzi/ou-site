#!/bin/sh
# Copie le build dans le volume static de façon atomique : /out/$OUT_DIR
set -eu
: "${OUT_DIR:?OUT_DIR requis (app ou admin)}"
mkdir -p /out
rm -rf "/out/$OUT_DIR.tmp"
cp -r /dist "/out/$OUT_DIR.tmp"
rm -rf "/out/$OUT_DIR"
mv "/out/$OUT_DIR.tmp" "/out/$OUT_DIR"
echo "publié dans /out/$OUT_DIR"
