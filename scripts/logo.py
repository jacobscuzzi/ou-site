"""Build the ou logo as outlined SVG from the OFL font files.

    uv run --with fonttools python scripts/logo.py SPRAY_TTF RUBIK_VARIABLE_TTF OUT_DIR

Writes logo-spray.svg (texture, for 24 px and up) and logo-solid.svg (Rubik 800, for smaller sizes),
both as a single path in currentColor plus the pink accent, and the icon / social SVG sources.
"""
import json
import math
import sys
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

PINK = "#ff1f8e"
INK = "#0b0b0d"
OFF_WHITE = "#f7f6f4"
TRACKING = -0.04
TILT = -5
ACCENT_TILT = 38


def glyphs(font, text):
    cmap = font.getBestCmap()
    gs = font.getGlyphSet()
    upm = font["head"].unitsPerEm
    x = 0
    out = []
    for ch in text:
        name = cmap[ord(ch)]
        out.append((gs[name], x))
        x += gs[name].width + TRACKING * upm
    return out, upm, gs


def outline(font, text):
    placed, upm, gs = glyphs(font, text)
    pen = SVGPathPen(gs)
    bounds = BoundsPen(gs)
    boxes = []
    for g, x in placed:
        # flip y so the path is in SVG space, baseline at y = 0
        g.draw(TransformPen(pen, (1, 0, 0, -1, x, 0)))
        b = BoundsPen(gs)
        g.draw(TransformPen(b, (1, 0, 0, -1, x, 0)))
        g.draw(TransformPen(bounds, (1, 0, 0, -1, x, 0)))
        boxes.append(b.bounds)
    return pen.getCommands(), bounds.bounds, boxes, upm


def accent(u_box, upm):
    # a grave accent over the u: centred a little left of the bowl, its lower end clear of the x-height
    x0, y0, x1, y1 = u_box
    w, h = 0.36 * upm, 0.14 * upm
    cx = x0 + (x1 - x0) * 0.5
    cy = y0 - 0.17 * upm
    return cx, cy, w, h


def rotated_box(points, deg, cx, cy):
    a = math.radians(deg)
    xs, ys = [], []
    for x, y in points:
        dx, dy = x - cx, y - cy
        xs.append(cx + dx * math.cos(a) - dy * math.sin(a))
        ys.append(cy + dx * math.sin(a) + dy * math.cos(a))
    return min(xs), min(ys), max(xs), max(ys)


def build(font, text="ou"):
    d, (x0, y0, x1, y1), boxes, upm = outline(font, text)
    ax, ay, aw, ah = accent(boxes[1], upm)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    corners = [(x0, y0), (x1, y0), (x0, y1), (x1, y1)]
    a = math.radians(ACCENT_TILT)
    for sx in (-1, 1):
        for sy in (-1, 1):
            px = ax + sx * aw / 2 * math.cos(a) - sy * ah / 2 * math.sin(a)
            py = ay + sx * aw / 2 * math.sin(a) + sy * ah / 2 * math.cos(a)
            corners.append((px, py))
    bx0, by0, bx1, by1 = rotated_box(corners, TILT, cx, cy)
    pad = 0.02 * upm
    vb = (bx0 - pad, by0 - pad, bx1 - bx0 + 2 * pad, by1 - by0 + 2 * pad)
    body = (
        f'<g transform="rotate({TILT} {cx:.1f} {cy:.1f})">'
        f'<path d="{d}" fill="currentColor"/>'
        f'<rect x="{ax - aw / 2:.1f}" y="{ay - ah / 2:.1f}" width="{aw:.1f}" height="{ah:.1f}" rx="{ah / 2:.1f}" '
        f'fill="{PINK}" transform="rotate({ACCENT_TILT} {ax:.1f} {ay:.1f})"/></g>'
    )
    return body, vb


def svg(body, vb, color=None, bg=None, size=None, scale=1.0):
    x, y, w, h = vb
    if size:
        side = max(w, h) / scale
        cx, cy = x + w / 2, y + h / 2
        x, y, w, h = cx - side / 2, cy - side / 2, side, side
    rect = f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{bg}"/>' if bg else ""
    style = f' color="{color}"' if color else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x:.1f} {y:.1f} {w:.1f} {h:.1f}"{style}>'
        f"{rect}{body}</svg>\n"
    )


def social(body, vb):
    x, y, w, h = vb
    W, H = 1200, 630
    s = 360 / h
    tx = W / 2 - (x + w / 2) * s
    ty = H / 2 - (y + h / 2) * s
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" color="#ffffff">'
        f'<rect width="{W}" height="{H}" fill="{INK}"/>'
        f'<g transform="translate({tx:.1f} {ty:.1f}) scale({s:.4f})">{body}</g></svg>\n'
    )


def main():
    spray_path, rubik_path, out = sys.argv[1], sys.argv[2], Path(sys.argv[3])
    out.mkdir(parents=True, exist_ok=True)
    spray = TTFont(spray_path)
    solid = instantiateVariableFont(TTFont(rubik_path), {"wght": 800})
    meta = {}
    for name, font in (("spray", spray), ("solid", solid)):
        body, vb = build(font)
        (out / f"logo-{name}.svg").write_text(svg(body, vb))
        (out / f"icon-{name}.svg").write_text(svg(body, vb, "#ffffff", INK, size=True, scale=0.78))
        (out / f"maskable-{name}.svg").write_text(svg(body, vb, "#ffffff", INK, size=True, scale=0.56))
        meta[name] = {"viewBox": [round(v, 1) for v in vb], "body": body}
        if name == "spray":
            (out / "social.svg").write_text(social(body, vb))
    (out / "logo.json").write_text(json.dumps(meta))


if __name__ == "__main__":
    main()
