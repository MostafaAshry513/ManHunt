# ManHunt motion kit — design + algorithmic philosophy

Two philosophies stand behind this kit. The first is the visual one that decides what a ManHunt surface
looks like; the second is the computational one that decides how it moves. They were written before the
assets were built and every render in this folder is an attempt to be faithful to them.

---

## I. Visual philosophy — *Chalk Field Guide*

**The pitch is borrowed.** ManHunt is played on ground nobody built for it: a car park, a campus quad, six
streets and a stairwell. At night the only thing that turns that ground into a field is what somebody drew
on it. So the brand draws like a player: chalk lines a little too thick, a circle that does not quite
close, arrows that get shorter as they run out of room. Nothing is rendered. Everything looks marked. The
composition is not a layout with decoration on top; it is the evidence of a game being organised.

**The ground is the darkest thing in the frame, and the markings are the light.** Deep navy field, chalk
white, one hairline where a rule belongs. Colour is never decoration — it is reserved for the two things
that move. Cyan is the field and the referee: the zone, the sweep, the line that says *this is the game*.
Coral is the Prey, the one who is exposed. Violet is the Hunters, the ones closing in. Any surface that
uses a team colour for the field, or the field colour for a team, teaches the wrong game and is wrong.

**Every plate is a field-guide plate for a sport that does not exist yet.** Margins are a rule, not a taste.
There is one decisive gesture per surface and a great deal of quiet around it. Typography is a condensed
athletic grotesque for the loud moments and a tight, plain grotesque for the voice; the MANHUNT wordmark is
drawn, never set — it is the same seven glyphs at every size, and it is treated with the care of an
engraving. Numbers are tabular. Small labels exist only where the content is genuinely data or genuinely a
team name. A clock is always somewhere in the composition, because the clock is what makes a game a game.

**Craftsmanship shows up as restraint.** The hard part is not adding the fifth dot; it is knowing that four
carry the chase and the fifth only makes noise. Every hairline weight, every 0.5 % opacity of chalk dust,
every margin on a 2560 × 1440 canvas was laboured over — not to be noticed, but so that nothing feels
accidental. The renders should look like they came from someone at the top of broadcast-graphics craft who
has shipped a thousand lower thirds and still aligns by eye. If a surface needs a gradient to work, the
composition is wrong; go back and fix the bones.

**The identity's one small secret is the gap.** The Open Zone mark is a ring that does not close, with the
coral dot sitting in the opening — someone is out, or about to be. That idea is the whole brand in one
shape: the field is never fully enclosed, the chase is never fully settled. Every banner here quietly
repeats it: the cyan zone ring on the radar has a deliberate 24° gap at −58°, and the Prey keeps crossing
it.

---

## II. Algorithmic philosophy — *Perpetual Pursuit*

**Beauty lives in the loop, not the frame.** The system here is a small closed dynamical system: one Prey
running a closed evasion orbit, a handful of Hunters whose positions are sampled from that same orbit at a
phase lag, a sweep that reveals them, and pings that mark where the Prey was when the phone reported.
Everything is a pure function of a single normalised phase τ ∈ [0,1), and frame 0 is constructed to be
identical to frame 1, so the loop is seamless by mathematics rather than by masking a cut. A still from any
moment of this system is a legitimate composition; the loop is the artwork.

**Seeded, not random.** Each surface shares the same deterministic seed: a mulberry32 stream produces the
block map's irregular street grid, the chalk specks, and the three harmonic phases that distinguish one
iteration's chase from another's. Two harmonics of radius wobble (`sin 3θ`, `sin 5θ`) mean the Prey's route
is never a perfect ellipse — it reads as *run*, not as *animated*. The seed is the identity of the piece;
change it and you get a sibling, not a different design. Nothing is hand-placed at a keyframe.

**The chase never resolves — that is the concept.** Hunters are the Prey's own past positions, fanned to
both sides and pulled slightly inward, breathing between 0.74 and 0.85 of the orbit radius. They are always
close, always a little too slow. The system's equilibrium is permanent near-capture: the net tightens and
loosens, the pings keep firing, the sweep keeps turning, and the Prey keeps finding the gap. It is a
hunt that cannot end because ending it would end the loop. The dashboard is not a HUD bolted onto a brand;
it is the smallest honest model of the game — a field, two teams, a clock, and a phone that tells.

**The craftsmanship is in the tuning.** The sweep is two flat cones and a leading edge, not a gradient: the
difference between *radar* and *cosplay radar* is about 0.02 alpha. The blip falloff is an exponential with a
hand-tuned sharpness per team so a dot flares as the sweep crosses it and fades before the eye can name it.
The pings start where the report happened, not where the dot is now, because the phone reports and the body
runs. The trail keeps exactly the last 14 % of the route — short enough to read as speed, long enough to
read as direction. These constants were refined by looking at hundreds of rendered frames, and they are the
product of deep familiarity with computational aesthetics, not defaults.

**Reduced motion is a first-class output.** The system is designed so its τ = 0 state is a complete still:
the zone, its gap, the two teams, the trail, the sweep bearing. Motion is an enhancement layered on a
composition that already works muted, small, and still — which is also why the same algorithm survives
being printed as a 1280 × 480 GIF, a CSS installation, a Compose canvas, and a video frame. The algorithm
does not care what the medium is; it only asks that the medium agree that the chase is the point.
