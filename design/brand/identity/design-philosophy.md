# Design philosophy — "Scored Chalk"

*A visual philosophy for the ManHunt mark, and the method used to find it.*

## 1.

A borrowed field is never drawn, it is **scored**. Someone takes a piece of chalk and presses a circle
into asphalt that was never meant to hold one; the line is too thick at the start, thins as the arm
runs out, and stops a hand's width before it closes. That unfinished circle is the whole game: a rule
that exists only because people agreed to it, in a place that belongs to everyone else. The mark should
be one compressed rule of that diagram — not a picture of a field, but the single scored line that
turns a car park into a pitch.

## 2.

Form is therefore **reduced to the gesture and nothing else**: a ring, a corner, a stroke, a dot. Each
shape is a verb — *closing, waiting, chasing, touching* — and each is drawn as if by a person with a
chalk stick and a strict hand: uniform weight, square-cut ends, real corners, no decoration. Chalk does
not taper to a decorative point; it stops where the hand stopped. The geometry is exact, but it is the
exactness of a scored line on rough ground, not of a vector tool showing off. Nothing is rendered,
nothing is beveled, nothing glows.

## 3.

Space is the other half of the drawing. The field is the darkest thing in the frame, and every mark
must earn the empty ground it displaces; the dark is not background but the thing that makes the line
readable. Negative space is measured, not poetic: a gap between the ring and the dot is a **distance in
the game** — someone is out of the zone, someone is about to be caught — so the gap is set to the exact
width where the eye reads *tension* rather than *breakage*. That is the whole craft of the mark: a few
millimetres of empty asphalt that decide whether it reads as a chase or as a logo that could belong to
any app.

## 4.

Colour obeys one rule, inherited from the product: **the field is not a player**. Cyan is the ground's
own signal — the zone, the referee, the rule — and is never spent on a team. Coral is the exposed one;
violet is the ones closing in. A single hot colour is allowed per composition, and everything else
must know its place. Depth comes from overlap and hairlines, never from light. The palette is not
decorated; it is assigned.

## 5.

Scale is the honest judge. A mark lives at 16, 24, 48, 512 and three metres tall, and the same drawing
must survive all of them; detail that cannot survive 48 px is not detail, it is decoration and is cut.
The final test is silence: remove the colour, remove the ground, remove every explanation, print the
mark in one ink — if it is still recognisably the same gesture, the mark is finished. This is painstaking,
unforgiving work: dozens of full drawings are discarded for one that reads at every size, and each
surviving line is the product of deep expertise and countless refinements rather than a single good idea.

## 6. Method — the algorithm as a drawing instrument

The marks were found computationally, in the spirit of generative practice: every concept is a small
parametric system (radius, stroke weight, gap angle, dot radius, gap distance), and **more than sixty
candidate drawings** were generated across three strategy families — the unclosed zone, the real-place
corner, the tag instant — then rendered at 300, 96, 48, 24 and 16 px in colour and in monochrome and
judged on silhouette first. Parameters were swept deliberately: gap angles from 60° to 84°, dot offsets
around the zone's mouth, stroke weights from 9.4 to 12.6, leg lengths and rotations on the corner. The
losers are documented in `previews/process/`, not hidden. What survived is not the most interesting
drawing — it is the drawing whose *behaviour* held at every size, in one ink, on both grounds. The
algorithm produced the candidates; the restraint chose the mark.

## 7. Expression

The philosophy is expressed in three specimens (`previews/01-open-zone/sheet.png`,
`previews/02-the-corner/sheet.png`, `previews/03-the-tag/sheet.png`) and their vector sources
(`concepts/<concept>/mark.svg`). Each plate is a clinical drawing sheet: one gesture, one rule, the
mark at real pixel sizes, measured measurements, and nothing that does not help someone build it
correctly. Sparseness is the point; every panel is a test the mark has to pass.
