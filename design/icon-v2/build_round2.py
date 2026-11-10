from pathlib import Path
from html import escape

ROOT = Path(r"C:\dev\ManHunt\design\icon-v2")
OUT = ROOT / "samples2"
OUT.mkdir(exist_ok=True)

INK = "#08090A"
SURFACE = "#121416"
BONE = "#F3EFE6"
FLARE = "#FF5A36"
LIME = "#B8F04A"

# Each mark is deliberately a big, single idea: a player, a hunter, a tool, a badge.
ICONS = [
    (
        "peek", "Peek",
        "A hider half behind a flare wall. One eye, one lime point; the rest is inference.",
        "Most human. Hide-and-seek reads in one glance.",
        f'''<rect x="58" y="25" width="22" height="60" fill="{FLARE}"/>
<rect x="58" y="25" width="2.6" height="60" fill="{BONE}" opacity=".20"/>
<circle cx="46" cy="50" r="12" fill="{BONE}"/>
<path d="M25 83 C26 67 35 61 46 61 C57 61 66 67 67 83 Z" fill="{BONE}"/>
<circle cx="51" cy="49" r="3.2" fill="{LIME}"/>''',
    ),
    (
        "hound", "Hound",
        "The hunter as a blunt hound head. Two ears, a dark muzzle, one lime nose. It belongs to the name.",
        "Character without a mascot costume.",
        f'''<path d="M38 42 C24 33 15 50 21 69 C24 79 34 77 35 66 Z" fill="{BONE}"/>
<path d="M70 42 C84 33 93 50 87 69 C84 79 74 77 73 66 Z" fill="{BONE}"/>
<rect x="31" y="33" width="46" height="47" rx="15" fill="{BONE}"/>
<rect x="43" y="56" width="22" height="17" rx="5" fill="{INK}"/>
<circle cx="54" cy="59" r="3.1" fill="{LIME}"/>
<circle cx="42" cy="48" r="2.7" fill="{LIME}"/><circle cx="66" cy="48" r="2.7" fill="{LIME}"/>
<rect x="38" y="79" width="32" height="7" fill="{FLARE}"/>''',
    ),
    (
        "flash", "Flash",
        "A hand searchlight cutting the night. The beam is the only quiet shape; the dot is what it finds.",
        "A tool from the hunt, not an abstract signal.",
        f'''<g transform="rotate(-38 54 54)">
<rect x="20" y="46" width="28" height="15" rx="3" fill="{FLARE}"/>
<path d="M47 48 L80 28 L87 35 L87 65 L80 72 L47 61 Z" fill="{BONE}" opacity=".24"/>
<circle cx="82" cy="50" r="3.8" fill="{LIME}"/>
</g>''',
    ),
    (
        "run", "Run",
        "A body mid-stride over a flare ground line. The game is movement, not a pin on a map.",
        "Most kinetic. Good for a game-first icon.",
        f'''<circle cx="49" cy="30" r="6" fill="{BONE}"/>
<path d="M53 37 L43 51 L51 62 L64 51" fill="none" stroke="{BONE}" stroke-width="7" stroke-linejoin="miter"/>
<path d="M43 51 L32 69 M51 62 L62 78" fill="none" stroke="{BONE}" stroke-width="6"/>
<path d="M25 84 L83 84" stroke="{FLARE}" stroke-width="4"/>
<circle cx="78" cy="55" r="3.4" fill="{LIME}"/>''',
    ),
    (
        "patch", "Patch",
        "A crew patch: flare disc, stitched bone edge, an M bolt and the report point. The game as something you wear.",
        "Most merch-like; a strong sticker/apparel seed.",
        f'''<circle cx="54" cy="54" r="29" fill="{FLARE}"/>
<circle cx="54" cy="54" r="23" fill="none" stroke="{BONE}" stroke-width="1.6" stroke-dasharray="3 4"/>
<path d="M39 67 L39 41 L54 55 L69 41 L69 67" fill="none" stroke="{BONE}" stroke-width="7" stroke-linejoin="miter"/>
<circle cx="54" cy="72" r="3" fill="{LIME}"/>''',
    ),
    (
        "eye", "Watch",
        "An eye, not a logo: the field watches back. Flare iris, lime pupil, bone lid.",
        "Most graphic. A strong shortcut for 'hunted'.",
        f'''<path d="M22 54 Q54 25 86 54 Q54 83 22 54 Z" fill="{BONE}"/>
<circle cx="54" cy="54" r="13" fill="{FLARE}"/>
<circle cx="54" cy="54" r="5" fill="{LIME}"/>''',
    ),
    (
        "stencil", "Stencil",
        "A flare plate with the M cut straight through it. One letter, no wordmark, no ornament.",
        "Most ownable as a brand stamp.",
        f'''<rect x="27" y="27" width="54" height="54" fill="{FLARE}"/>
<path d="M39 72 L39 38 L54 54 L69 38 L69 72" fill="none" stroke="{INK}" stroke-width="9" stroke-linejoin="miter"/>
<circle cx="54" cy="54" r="3.2" fill="{LIME}"/>''',
    ),
    (
        "claw", "Claw",
        "Three flare cuts across a bone field plate. The mark of something that came through.",
        "Most aggressive; a hunter-side icon.",
        f'''<path d="M30 30 H78 V78 H30 Z" fill="{BONE}"/>
<g stroke="{FLARE}" stroke-width="7" stroke-linecap="square">
<path d="M30 37 L60 78"/><path d="M42 29 L73 71"/><path d="M56 30 L78 56"/>
</g>
<circle cx="70" cy="36" r="3.2" fill="{LIME}"/>''',
    ),
]

CSS = """
@font-face{font-family:"Bricolage";src:url("../BricolageGrotesque.ttf") format("truetype");font-weight:200 800;font-stretch:75% 100%}
@font-face{font-family:"Archivo";src:url("../Archivo.ttf") format("truetype");font-weight:100 900;font-stretch:62% 125%}
@font-face{font-family:"Plex";src:url("../IBMPlexMono-Regular.ttf") format("truetype");font-weight:400}
:root{--ink:#08090A;--surface:#121416;--bone:#F3EFE6;--paper:#FFFCF7;--muted:#5F5A52;--dim:#81796D;--line:#C9C1B3;--line-soft:#DED7CA;--flare:#FF5A36;--lime:#B8F04A;--display:"Bricolage",Georgia,serif;--sans:"Archivo",system-ui,sans-serif;--mono:"Plex",ui-monospace,monospace}
*{box-sizing:border-box}html,body{margin:0;background:var(--bone);color:var(--ink);font-family:var(--sans)}
.sheet{width:1600px;padding:54px 64px 40px}
.top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid var(--line);padding-bottom:22px}
.brand{display:inline-flex;align-items:center;gap:10px;font:700 20px/1 var(--display);letter-spacing:-.03em}
.slash{width:22px;height:22px;position:relative}.slash:before,.slash:after{content:"";position:absolute;left:10px;top:0;width:2px;height:22px;background:var(--flare)}.slash:before{transform:rotate(38deg)}.slash:after{transform:rotate(-38deg);background:var(--ink)}
.top .right{text-align:right;font:10px/1.6 var(--mono);color:var(--dim)}
.top h1{font:600 68px/.86 var(--display);letter-spacing:-.06em;margin:28px 0 0;max-width:1000px}.top h1 span{display:block}
.intro{display:grid;grid-template-columns:1.1fr .9fr;gap:56px;padding:28px 0 30px;border-bottom:1px solid var(--line)}
.intro p{max-width:610px;font-size:15px;line-height:1.55;color:var(--muted);margin:0}.intro p b{color:var(--ink);font-weight:600}
.direction{display:grid;grid-template-columns:120px 1fr;gap:9px 18px;font-size:12px;line-height:1.45}.direction dt{font:10px/1.5 var(--mono);color:var(--dim)}.direction dd{margin:0;color:var(--muted)}.direction dd b{color:var(--ink);font-weight:600}
.audit{display:grid;grid-template-columns:1fr 1fr;gap:26px 56px;padding:22px 0 28px;border-bottom:1px solid var(--line)}
.audit h2{font:600 13px/1.2 var(--sans);margin:0 0 8px;letter-spacing:-.01em}.audit ul{margin:0;padding:0;list-style:none;font-size:12px;line-height:1.55;color:var(--muted)}.audit li{display:block;position:relative;padding-left:18px}.audit li+li{margin-top:8px}.audit li:before{content:"Ã¢â‚¬â€";position:absolute;left:0;top:0;font-family:var(--mono);color:var(--dim)}.audit li em{font-style:normal;color:var(--ink)}
.section-head{display:flex;align-items:flex-end;justify-content:space-between;margin:32px 0 14px}.section-head h2{font:600 28px/1 var(--display);letter-spacing:-.035em;margin:0}.section-head p{font:10px/1.4 var(--mono);color:var(--dim);margin:0}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.card{background:var(--paper);border:1px solid var(--line);padding:12px}.art{background:var(--ink);border-radius:2px;overflow:hidden;aspect-ratio:1}.art svg{width:100%;height:100%;display:block}
.card-top{display:flex;justify-content:space-between;align-items:baseline;margin:10px 1px 0}.card-top .n{font:10px/1 var(--mono);color:var(--flare)}.card-top h3{font:600 19px/1 var(--display);letter-spacing:-.03em;margin:0}
.card p{font-size:11px;line-height:1.45;color:var(--muted);margin:6px 1px 0;min-height:48px}
.sizes{display:flex;align-items:center;gap:14px;border-top:1px solid var(--line-soft);margin-top:10px;padding-top:10px}.sizes .box{display:grid;place-items:center;background:var(--ink);border-radius:2px;flex:none;overflow:hidden}.sizes .box svg{width:100%;height:100%;display:block}.sizes .b48{width:48px;height:48px}.sizes .b32{width:32px;height:32px}.sizes .b24{width:24px;height:24px}.sizes span{font:9px/1.4 var(--mono);color:var(--dim)}
.shortlist{background:var(--ink);color:var(--bone);margin:36px -64px 0;padding:38px 64px 40px}.shortlist .section-head{margin:0 0 18px}.shortlist .section-head h2{color:var(--bone)}.shortlist .section-head p{color:var(--muted)}
.picks{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}.pick{display:grid;grid-template-columns:134px 1fr;gap:16px;align-items:start;border-top:1px solid #2A2D31;padding-top:18px}
.pick .shapes{display:flex;flex-direction:column;gap:8px;align-items:center}.frame{width:100px;height:100px;background:var(--surface);border:1px solid #2A2D31;display:grid;place-items:center;overflow:hidden}.frame svg{width:100%;height:100%;display:block}.frame.circle{border-radius:50%}.frame.squircle{border-radius:22%}.pick .mono{width:48px;height:48px;background:var(--bone);border-radius:50%;display:grid;place-items:center;overflow:hidden}.pick .mono svg{width:100%;height:100%}
.pick h3{font:600 23px/1 var(--display);letter-spacing:-.035em;margin:0 0 7px}.pick p{font-size:11px;line-height:1.5;color:#A6A39B;margin:0}.pick .why{font:9px/1.5 var(--mono);color:var(--dim);margin-top:10px}
footer{display:flex;justify-content:space-between;border-top:1px solid var(--line);margin-top:28px;padding-top:14px;font:9px/1.4 var(--mono);color:var(--dim)}
"""


def art(name, body, cls="icon", label=""):
    return f'<svg class="{cls}" data-icon="{name}" viewBox="0 0 108 108" role="img" aria-label="{escape(label)}"><rect width="108" height="108" fill="{INK}"/>{body}</svg>'


def mono(name, body):
    # Recolour non-ink fills to ink, keep ink cut-outs bone for the light mono disc.
    b = body.replace(INK, "@CUT@").replace(BONE, "@FG@").replace(FLARE, "@FG@").replace(LIME, "@FG@")
    b = b.replace("@FG@", INK).replace("@CUT@", BONE)
    return f'<svg viewBox="0 0 108 108" role="img" aria-label="{name}"><rect width="108" height="108" fill="{BONE}"/>{b}</svg>'


cards = []
for i, (key, name, desc, strength, body) in enumerate(ICONS, 1):
    cards.append(f'''<article class="card">
<div class="art">{art(key, body, label=name)}</div>
<div class="card-top"><span class="n">{i:02d}</span><h3>{name}</h3></div>
<p>{desc}</p>
<div class="sizes">
<div class="box b48">{art(key, body, label=name)}</div>
<div class="box b32">{art(key, body, label=name)}</div>
<div class="box b24">{art(key, body, label=name)}</div>
<span>48 / 32 / 24</span>
</div></article>''')

picks = []
for key, name, desc, strength, body in ICONS:
    if key in ("peek", "hound", "flash"):
        picks.append(f'''<article class="pick">
<div class="shapes">
<div class="frame circle">{art(key, body, label=name)}</div>
<div class="frame squircle">{art(key, body, label=name)}</div>
<div class="mono">{mono(key, body)}</div>
</div>
<div><h3>{name}</h3><p>{desc}</p><div class="why">{strength.upper()}</div></div>
</article>''')

html = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ManHunt Ã¢â‚¬â€ launcher icon study 02</title><style>{CSS}</style></head>
<body><div class="sheet">
<div class="top"><div><div class="brand"><span class="slash"></span>MANHUNT</div>
<h1><span>Put the player</span><span>in the icon.</span></h1></div>
<div class="right">LAUNCHER ICON STUDY Ã¢â‚¬â€ 02<br>CHARACTER + OBJECT / NIGHT SHIFT<br>NOT APPLIED YET</div></div>

<div class="intro">
<p>Round one was eight marks. None of them had a <b>player</b> in it. This round turns the icon back into a game: a hider, a hound, a searchlight, a runner, a patch, an eye, an M, a claw. Same palette and signature, none of the geometry repeated.</p>
<dl class="direction">
<dt>PRODUCT</dt><dd>A live two-team hide-and-seek game played on real streets.</dd>
<dt>CHARACTER</dt><dd><b>Alive, tense, a little dangerous.</b> A game people play, not a dashboard they use.</dd>
<dt>WORLD</dt><dd>Night streets, a wall to hide behind, a torch, a crew patch.</dd>
<dt>MOMENT</dt><dd>The second before you are found, or the second before you find someone.</dd>
<dt>SIGNATURE</dt><dd><b>One lime report point</b> on every direction.</dd>
</dl></div>

<div class="audit">
<div><h2>Why round one failed</h2><ul>
<li><em>All eight were marks.</em> Ticket, ring, fold, grid, monogram Ã¢â‚¬â€ no player, no story, no reason to pick one up.</li>
<li><em>Too polite.</em> The palette was right; the forms were all thin, centred, logo-exercise geometry.</li>
<li><em>Same silhouette family.</em> At a glance most of them read as a map or a scanner, not a hunt.</li>
<li><em>No character.</em> The app pages have a voice; the icons had a grid.</li>
</ul></div>
<div><h2>What this round changes</h2><ul>
<li><em>Big single forms.</em> A head, a hound, a beam, a body. Fewer elements, bigger shapes, less line work.</li>
<li><em>Game-first reads.</em> Hide, hunt, search, run; the productÃ¢â‚¬â„¢s verbs before its system diagrams.</li>
<li><em>One point of life.</em> Every direction still keeps the lime report point.</li>
<li><em>Tested at launcher size.</em> 48 / 32 / 24 px, circle and squircle, monochrome.</li>
</ul></div></div>

<div class="section-head"><h2>Eight directions</h2><p>DARK GROUND / 48 Ã‚Â· 32 Ã‚Â· 24 PX CHECK</p></div>
<div class="grid">{''.join(cards)}</div>

<div class="shortlist"><div class="section-head"><h2>What survives the launcher</h2><p>ADAPTIVE MASK / MONOCHROME / SAFE ZONE</p></div>
<div class="picks">{''.join(picks)}</div></div>

<footer><span>MANHUNT / REAL-WORLD GPS HIDE-AND-SEEK</span><span>ICON STUDY 02 / 8 DIRECTIONS / NIGHT SHIFT SYSTEM</span><span>UNSLOP BY @HEYDAMIR Ã‚Â· CC BY 4.0</span></footer>
</div></body></html>'''

html = html.replace("Ã¢â‚¬â€", "-").replace("Ã¢â‚¬â„¢", "'").replace("Ã‚Â·", "/").replace("â€", '"').replace("â„¢", "")
(ROOT / "round2.html").write_text(html, encoding="utf-8")

# Export 512 pngs and the sheet via Playwright.
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(headless=True, executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe")
    page = b.new_page(viewport={"width": 1600, "height": 1200}, device_scale_factor=1)
    page.goto((ROOT / "round2.html").as_uri(), wait_until="networkidle")
    page.wait_for_timeout(300)
    page.screenshot(path=str(ROOT / "round2-study-sheet.png"), full_page=True)
    icons = page.locator(".grid .art svg.icon")
    for i in range(icons.count()):
        el = icons.nth(i)
        name = el.get_attribute("data-icon")
        el.evaluate("(e)=>{e.style.width='512px';e.style.height='512px';e.style.maxWidth='none';e.style.display='block'}")
        el.screenshot(path=str(OUT / f"{i+1:02d}-{name}.png"))
        el.evaluate("(e)=>{e.style.width='';e.style.height='';e.style.maxWidth='';e.style.display=''}")
    b.close()

print("round2 built", len(ICONS))
