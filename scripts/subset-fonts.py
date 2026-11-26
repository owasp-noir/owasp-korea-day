#!/usr/bin/env python3
"""Build the web fonts in static/fonts/ and the @font-face rules in static/css/fonts.css.

The site serves its own fonts so a page needs no host but this one. Each
Korean family is cut in two:

  *-site.woff2   the characters the site uses today (small, always loaded)
  *-rest.woff2   the rest of everyday Korean (KS X 1001), loaded only when a
                 page uses a character the first file does not have

The two never cover the same character: a script that asks for a font by the
text it will draw (the 3D desk does) would otherwise fetch both.

So the fonts keep working when the text changes; re-run this only to make the
first file match the text again.

Usage:
    hwaro build
    pip install fonttools brotli
    python3 scripts/subset-fonts.py <directory with the source fonts>

Source fonts (all SIL Open Font License 1.1):
    Hahmlet[wght].ttf        github.com/google/fonts  ofl/hahmlet
    JetBrainsMono[wght].ttf  github.com/google/fonts  ofl/jetbrainsmono
    PretendardVariable.ttf   github.com/orioncactus/pretendard  packages/pretendard/dist/public/variable

Pretendard is a Reserved Font Name, and a subset is a modified version, so
the body font is renamed "Handson Sans" in the file and in the CSS.
"""
import sys
from io import BytesIO
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "static" / "fonts"

# family, source file, weight range kept, new name (or None), Korean?
FONTS = [
    ("Hahmlet", "Hahmlet[wght].ttf", (800, 800), None, True),
    ("Handson Sans", "PretendardVariable.ttf", (400, 800), "Handson Sans", True),
    ("JetBrains Mono", "JetBrainsMono[wght].ttf", (400, 700), None, False),
]

def site_chars():
    files = list((ROOT / "public").rglob("*.html")) + [ROOT / "static/js/desk.js", ROOT / "static/js/site.js"]
    if len(files) < 3:
        sys.exit("public/ is empty: run `hwaro build` first")
    chars = set(range(0x20, 0x7F))
    for f in files:
        chars.update(ord(c) for c in f.read_text(encoding="utf-8") if ord(c) > 0x7F)
    return chars


def everyday_korean():
    chars = set(range(0x20, 0x7F)) | set(range(0xA0, 0x100)) | set(range(0x2000, 0x2070))
    chars |= set(range(0x2190, 0x2200)) | set(range(0x3000, 0x3040)) | set(range(0x3130, 0x3190))
    for hi in range(0xB0, 0xC9):  # the 2,350 syllables of KS X 1001
        for lo in range(0xA1, 0xFF):
            chars.add(ord(bytes([hi, lo]).decode("euc_kr")))
    return chars


def ranges(codepoints):
    out, pts = [], sorted(codepoints)
    start = prev = pts[0]
    for p in pts[1:] + [None]:
        if p is not None and p == prev + 1:
            prev = p
            continue
        out.append("U+%X" % start if start == prev else "U+%X-%X" % (start, prev))
        start = prev = p
    return ", ".join(out)


def rename(font, name):
    for record in font["name"].names:
        if record.nameID in (1, 16):
            record.string = name
        elif record.nameID in (3, 4):
            record.string = name + " Variable"
        elif record.nameID in (6, 25):
            record.string = name.replace(" ", "") + "-Variable"


def cut(font, chars, path):
    options = subset.Options(flavor="woff2", layout_features=["*"], name_IDs=["*"], notdef_outline=True)
    sub = subset.Subsetter(options)
    sub.populate(unicodes=chars)
    sub.subset(font)
    font.flavor = "woff2"
    font.save(path)
    return path.stat().st_size


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    src = Path(sys.argv[1])
    OUT.mkdir(parents=True, exist_ok=True)
    used, everyday = site_chars(), everyday_korean()
    css = ["/* Written by scripts/subset-fonts.py. Do not edit by hand. */"]

    for family, file, (lo, hi), new_name, korean in FONTS:
        slug = family.lower().replace(" ", "-")
        # The rest file's rule is written first. Before any file of a family
        # has arrived, Chrome starts fetching the family's last-declared face
        # to measure text with, whatever its range; with "site" last that is
        # the small file the page needs anyway. The other way round it pulled
        # the large file on about six loads in ten.
        parts = [("rest", everyday - used)] if korean else []
        parts.append(("site", used))
        for part, chars in parts:
            font = TTFont(src / file)
            # One weight makes a static font, about 40% smaller than a range.
            instancer.instantiateVariableFont(font, {"wght": lo if lo == hi else (lo, hi)}, inplace=True)
            if new_name:
                rename(font, new_name)
            # The subsetter wants the narrowed font read back from bytes.
            narrowed = BytesIO()
            font.save(narrowed)
            font = TTFont(BytesIO(narrowed.getvalue()))
            have = chars & set(font.getBestCmap())
            name = "%s-%s.woff2" % (slug, part) if korean else slug + ".woff2"
            size = cut(font, have, OUT / name)
            print("%-28s %5d characters %7.1f KB" % (name, len(have), size / 1024))
            css.append(
                '@font-face { font-family: "%s"; font-style: normal; font-weight: %s; font-display: swap; '
                'src: url("../fonts/%s") format("woff2"); unicode-range: %s; }'
                % (family, lo if lo == hi else "%d %d" % (lo, hi), name, ranges(have))
            )

    (ROOT / "static/css/fonts.css").write_text("\n".join(css) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
