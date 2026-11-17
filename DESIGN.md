# System Design From Scratch: design notes

World: a transit line map (Beck/Vignelli diagram plus station signage). Each phase is a coloured line, each lesson a station, prerequisites are interchanges.

- Surface: Read mode (long lessons). Ambition shows as clarity, not decoration.
- Themes: tunnel navy (dark, bg #0C1626, accent #FFD43B) and cool tile-white (light, bg #E8EDF1, accent #1747C7). Follows the OS setting, with a Theme toggle.
- Line colours: 13 per theme (`--l0..--l12`, with `--t0..--t12` for text on the fill). Dark set is bright, light set is darkened to keep 4.5:1 for text on fill.
- Type: Archivo (expanded, 800) for headings, Atkinson Hyperlegible Next for body, JetBrains Mono only for numeric readouts. Fallbacks are system fonts when Google Fonts is unreachable.
- Motion: one authored moment, the map lines draw in once per visit, stations pop in after. Everything else is short state transitions. `prefers-reduced-motion` turns it off.
- Background: faint subway-tile SVG, never behind diagrams (diagrams sit on surface panels).
- Rules: no gradient text, no side-stripe accents on cards (the 8px line stripe sits on the top edge of a panel only), no emoji, state never carried by colour alone (done stations are filled, current has a ring).
- Files: `src/theme.css` (tokens), `src/styles.css` (components), built by `build.py` into one `index.html`.
