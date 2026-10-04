# Motion spec

Smart Car Dashboard, animated build. Every value comes from `src/motion/tokens.ts` (JS) and `src/styles/motion-tokens.css` (CSS). Modes: Expressive (E) and Dramatic (D). Under `prefers-reduced-motion` or the calm profile, every row becomes an opacity fade at `duration-short` or an instant swap; only the map pan keeps moving.

## Signature moments

| Component | Job | Mode | Duration | Curve or spring | Notes |
|---|---|---|---|---|---|
| Wake-up: panels | Character | D | `duration-hero` overall | `spring-dramatic` (rise), `duration-slow` + `ease-out-quint` (opacity, blur) | Rise 24px out of an 8px blur, left to right, 50ms stagger. Once per session; demo replays it |
| Wake-up: speed and battery | Orientation | D | 250 to 1000ms, 400 to 1050ms | `spring-value` | Gated at 0, then roll up. Digits that change faster than a roll swap instantly |
| Wake-up: limit ring, route | Orientation | D | `duration-slow`, `duration-xslow` | `ease-in-out-quart` | pathLength draw-on |
| Wake-up: nav card, climate and dock | Orientation | E | from 500ms, from 700ms | `spring-expressive` | Items rise 8px; climate and dock cascade 50ms apart |
| Gear pill | State | E, D into D | `duration-slow` visual | `spring-expressive` or `spring-dramatic` | Bounce solved per move: overshoot 3% of travel max 8px (E), 6% max 16px (D) |
| Gear into D | Feedback | D | `duration-short` up, then spring | `ease-out-quint`, then `spring-dramatic` | Numeral to 1.06 and back; one accent sweep along the battery bar (`duration-slow`, `ease-in-out-quart`) |
| Gear into P | State | E | `duration-slow` | `ease-out-quint` | Speed rolls to 0; secondary panels lift with a faint light layer (opacity only) |
| Drive mode thumb | State | E | `duration-slow` visual | `spring-expressive` | Label colour changes under a clip that follows the thumb; range rolls on `spring-expressive`; Sport takes the numeral from weight 200 to 300 |
| Theme change | Orientation | D | `duration-xslow` | `ease-in-out-quart` | View Transition with a soft mask edge, left to right. Reduced: crossfade at `duration-short` |
| Enter Vehicle health | Orientation | D | `duration-xslow` in, 60% of that out | `ease-in-out-quart` | Card surface clip-path morphs to the panel (no scaling). Back fades the surface over its last 30% onto the real card |
| Turn approaching | Attention | E | spring in, `duration-normal` out | `spring-expressive`, `ease-out-quint` | Under 100 m: card to 1.03, icon lifts. After the turn: old card up and out, new rises in; leaving card freezes its distance |

## Working parts

| Component | Job | Mode | Duration | Curve or spring | Notes |
|---|---|---|---|---|---|
| Speed numeral | Orientation | E | live | `spring-value` per tick, digit roll on a 140ms no-bounce spring | Per-digit slots, tabular figures, direction of change |
| Limit sign, new limit | State | E | `duration-short` out, spring in | `ease-in-out-quart`, `spring-expressive` | Y-axis flip; number swaps edge-on |
| Limit sign, over limit | Attention | E | 2 x `duration-slow` | `ease-in-out-quart` | Ring 8 to 12px and two pulses, then holds; label reads "Over limit". 2 km/h hysteresis, 5s pulse cooldown |
| Battery bar and % | State | E | live; colour `duration-slow` | `spring-value` | translateX in a clipped track; amber under 20% |
| Nav arrow | State | E | spring | `spring-expressive` | rotateY from the previous manoeuvre to the next |
| Map | Orientation | E | live | `spring-value` pan, `spring-expressive` heading | Three composited layers; route ahead draws, route behind fades; boundary moves in 4-unit steps |
| Trip bar and values | State | E | live | `spring-value`, digit roll | ETA, minutes, km and arrival % roll |
| Vehicle alert | Attention | E | in spring, out `duration-normal` | `spring-expressive`, `ease-out-quint` | Height auto in, two amber rings; out slides left and collapses |
| Media track change | State | E | spring | `spring-expressive` | Art 24px in the skip direction from 0.96 and 2px blur; title slides up |
| Media play and pause | Feedback | E | `duration-short` | `ease-out-quint` | Quarter-turn icon morph |
| Media progress | Orientation | n/a | per sim tick | linear | Constant motion; jumps back on a new track |
| Temperature | Feedback | E | press 160ms visual | `spring-press`, digit roll | 0.94 on press; hold repeats from 400ms, 180ms gaps speeding up 20% a step to 60ms |
| A/C | Feedback | E | `duration-normal` | `ease-out-quint` | Fill grows as a circle from the tap point |
| Fan | State | n/a | 72 deg/s per level | linear | WAAPI on the compositor; level changes set playbackRate; level 0 is off |
| Defrost, seat heat | Feedback | E | `duration-slow` | `ease-out-quint` | Heat lines rise once when switched on |
| Dock | State, feedback | E | spring | `spring-expressive`, `spring-press` | Shared background; icon dips to 0.92 |
| All pressables | Feedback | E | 160ms visual | `spring-press` | Tiles 0.96, temperature 0.94, dock 0.92 |

## Vehicle health sequence (first visit per session)

| Time | Part | Curve or spring | Notes |
|---|---|---|---|
| 0ms | Header | `spring-expressive` | Slides in from the left |
| 80ms | Car top view | `spring-dramatic` | Rises with rotateX 24 to 0 |
| 300ms + 50ms each | Tyre pressures | `spring-value` | 0.0 to value, clockwise from front left |
| 550ms | Front left | `duration-slow` | Turns amber; Low chip pops to 1.06; tyre glows twice then holds |
| 600ms + 30ms each | Systems rows | `spring-expressive` | Status dots scale from 0.6; UPDATE READY shimmers once |
| 750ms + 30ms each | Maintenance rows, buttons | `spring-expressive` | |
| 900ms | Assistant tip | `spring-expressive` | Sparkle turns 15deg once |
| Later visits | All | none | Content arrives with the container |

Actions: Add stop morphs to a check and "Added" (width on `spring-expressive`, icon 2px blur). Book service runs a progress fill (`duration-slow`, `ease-in-out-quart`) and resolves to the booking. Remind me later shrinks the action row away and rolls the header count down.

## Deliberately still

The clock, outside temperature, panel surfaces and dock layout.
