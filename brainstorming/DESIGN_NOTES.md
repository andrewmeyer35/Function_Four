# Four Fs — Design System (v2)

## The references, and what each one gave us

- **Duolingo** — streak mechanics + tiered flames (1-day vs 100-day look different), loss-aversion as engagement
- **Apple Fitness rings** — the single most iconic gamified data-viz of the decade. We generalized it from 3 rings to **4 concentric rings** (one per F) with a big center life-score number
- **Strava** — social feed cards with bold stat badges, public leaderboard, kudos as reactions
- **Spotify Wrapped** — bold display typography, vivid multi-stop gradients, data as visual spectacle
- **Finch** — warm pastels + emoji-as-character; emoji is used intentionally for personality
- **BeReal** — limited, friends-only feed; a shared moment
- **Beli** — ranking-battle framing; comparison as engagement

## Design tokens

- **Per-F gradients** (from → to):
  - 💰 Financial — `#fbbf24` → `#f97316` (amber → orange)
  - 💪 Fitness — `#a3e635` → `#10b981` (lime → emerald)
  - 🎉 Fun — `#38bdf8` → `#6366f1` (sky → indigo)
  - ❤️ Flirt — `#fb7185` → `#d946ef` (rose → fuchsia)
- **Brand gradient** (used on the hero number, primary CTAs, logo wordmark) — amber → pink → indigo diagonal
- **Typography** — Inter throughout. A `.font-display` utility turns on tabular numbers, tight negative tracking, and stylistic set 1 for score displays
- **Surface** — a custom `.surface-card` class: 78%-white over a radial-gradient page wash, with a soft inner highlight and a long drop shadow. Feels premium and light at the same time
- **Corners** — cards are `rounded-3xl` (24px) or `rounded-[28px]/[32px]` for hero tiles
- **Motion** — ring stroke-dashoffset is transitioned over 900ms with an ease-out cubic; numbers count up via requestAnimationFrame; chip taps scale to 96%; streak flame pulses at 7+ day streaks and shimmers at 30+; submit fires a 60-particle CSS emoji confetti burst

## Screens

### Home (household page)
1. Compact top bar — just the week label and household name
2. **Life Score Hero** — a single card dominating the top half of the screen:
   - 4 stacked Apple-style rings with gradient fills
   - Massive 72px brand-gradient number in the center (your life score /40)
   - Vibe caption underneath (contextual per score band, e.g. "Peak week" at 36+)
   - Tiered streak flame pill
   - Four small legend tiles at the bottom showing per-F score
3. Primary CTA — full-width "Check in for the week" button in a gradient on dark
4. Invite-code strip
5. **Leaderboard podium** — top 3 as a literal podium (gold/silver/bronze columns, avatars on top, score on the column), rest as a tight numbered list underneath
6. Feed cards — one per check-in, with the big /40 number on the right, per-F pills with gradient progress bars in a 2-column grid, truncated tag chips, and a reactions placeholder strip

### Check-in wizard
1. Step-dot progress bar tinted per-F with a running life-score readout top-right that counts up live as you move sliders
2. Main card with a **gradient header** using the current F's colors, a giant translucent emoji character behind the title, and a **live mini-ring** on the right that fills as you slide the score
3. Score slider — modern thumb (white, 3px currentColor border, soft shadow, active-state bloom), tick labels below with the current value bolded
4. Tag chips — gradient-fill when active for that F's palette; "Skipped" chip is mutually exclusive and auto-nulls the score
5. Optional note textarea
6. Submit button fires **confetti + a full-screen success state** that shows your life score counting up, then routes to the feed

### Login
- **Ring halo** — a 4-ring constellation at 70% fill rendering the brand with only visuals (no nav)
- Brand-gradient "Four Fs" wordmark
- Single email input → gradient magic-link CTA

### Onboarding (first run)
- 4 gradient F-tiles grid as a visual intro
- Tabbed create/join selector
- Matching gradient CTA

## Why these specific choices matter for roommates

- **The rings give everyone a glanceable week-at-a-glance** — you know in 0.3s whether Alex has crushed this week or is slacking
- **The podium is intentionally a battle metaphor** — it leans into the playful competitive energy that makes houses actually engage instead of reflecting solo
- **The streak flame tiers create a "don't be the one to break it" loop** that Duolingo proved works on hundreds of millions of people
- **Gradient color-coding per F means people can navigate the product by vibe** — you don't read labels, you tap the pink section
- **The confetti + count-up on submit** converts a chore into a little dopamine reward, which is the single highest-ROI interaction in gamified design
- **The surface-card aesthetic** (soft glassy white on a multi-radial wash) reads as modern/premium without being cold — the vibe we want is "Partiful meets Strava" not "enterprise dashboard"
