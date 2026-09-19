#!/bin/sh
# Publie le build dans le volume static : /out/$OUT_DIR.
# Quasi-atomique : la fenêtre où /out/$OUT_DIR manque se réduit à deux renommages,
# sans suppression dedans (Caddy sert déjà le volume pendant un redéploiement).
set -eu
: "${OUT_DIR:?OUT_DIR requis (app ou admin)}"
case "$OUT_DIR" in
  ""|.|..|*/*|*[!A-Za-z0-9_-]*) echo "OUT_DIR invalide : $OUT_DIR" >&2; exit 1 ;;
esac
mountpoint -q /out || { echo "/out n'est pas un volume monté" >&2; exit 1; }

rm -rf "/out/$OUT_DIR.tmp" "/out/$OUT_DIR.old"
cp -r /dist "/out/$OUT_DIR.tmp"
if [ -d "/out/$OUT_DIR" ]; then mv "/out/$OUT_DIR" "/out/$OUT_DIR.old"; fi
mv "/out/$OUT_DIR.tmp" "/out/$OUT_DIR"
rm -rf "/out/$OUT_DIR.old"
echo "publié dans /out/$OUT_DIR"
