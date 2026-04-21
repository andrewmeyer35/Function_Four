# Four Fs — Product Roadmap

## The pivot

Today the app is a *weekly retrospective*: at some point in the week, your roommates rate how their Financial / Fitness / Fun / Flirt went, and the household sees a feed. That's half the loop.

The other half is **planning**. People don't drift into a great week — they decide on Sunday night that this week they'll hit the gym three times, save $200, throw a game night, and text the person they met last Friday. Then life happens. The app should make it dead simple to (1) commit to that plan in front of your roommates, (2) log the wins as they happen, and (3) see honestly how you did vs. what you said.

So the loop becomes:

**Plan → Log → Reflect → Compare → Brag / Regroup.**

Everything below is sequenced to get that loop running end-to-end as fast as possible, with each phase shippable on its own.

---

## Guiding principles

- **Sub-30-second interactions.** Planning takes under 2 minutes. Logging a single activity takes one tap + one tap + done. Reflecting takes under 90 seconds.
- **One-tap beats typing.** Tags, sliders, counters, checkboxes. Text is always optional.
- **Peer pressure, not parent pressure.** The app never scolds. Roommates do, with emojis.
- **No one wants another dashboard.** The home screen is a *social* surface, not an analytics page.
- **Mobile-first web for MVP.** Looks good on a phone browser; native iOS comes after product-market fit with the four of you.

---

## Phase 1 — Plan the week (the big addition)

**Why this is next.** The app currently lacks the "plan" step entirely. Adding it transforms it from a vibes tracker into an accountability tool. It's also the part roommates will notice most.

### The Sunday planner

Appears as a dim orange banner on the home screen from Sunday 6pm → Monday 11:59pm: "It's planning time. Set your week." (Dismissable, but re-nags on Monday.) Opens the planner.

One screen per F, just like the check-in wizard, so the mental model stays the same. Per F you set **intentions** — tiny, concrete things:

- Tap a tag to add it as an intention (e.g., tap `🏋️ Gym`).
- Each added intention gets a small **count stepper** (`−  2  +`) and an **optional note** (e.g., "Mon / Wed / Fri"). Most tags default to count 1.
- Some tags are toggle-only (e.g., `💘 Date` doesn't need a count, you just want to plan it).
- Max 4 intentions per F to keep it sharp.

Optional "stretch goal" toggle on any intention — marking it as a reach tag with a ✨ renders it gold in the feed when completed.

### What roommates see

Starting Monday morning, each person's plan is visible on the home feed as a compact **Weekly Intentions card**: avatar, 4-row bar showing the 1–4 intentions per F with their counts and completion state (e.g., `🏋️ Gym  ▓▓▓░░  2/3`). Mid-week the bars fill in as people log.

### Data model additions

New `weekly_plans` table keyed by `(user_id, household_id, week_start)` with JSONB `intentions` — an object like `{ "financial": [{ tag, count, note, stretch }], … }`. Kept as JSONB instead of columns because intention shape will evolve.

---

## Phase 2 — Log as you go

**Why.** A plan without a logging loop becomes a wish list. Logging has to be essentially frictionless or it won't happen.

### The quick-log action

A floating `+ Log` button persistent on the home screen. Tapping opens a two-step sheet:

1. Pick an F (4 big colored buttons).
2. Tap a tag (same tags you planned, top of list). Optional half-line note. **Done.**

Each log is a row in a new `activity_logs` table with `(user_id, household_id, f_category, tag, note, logged_at)`. The app automatically matches logs to the current-week plan to increment the right counter. If you log something not in your plan, it still counts toward the F but as "bonus."

### Progress feedback

- The home feed card turns a bar segment green when a planned intention is fulfilled.
- Confetti animation when you fully complete an F for the week.
- A subtle "🎯 On pace" / "😬 Behind" indicator on your own card based on the day of the week.

### Nudges (opt-in)

- Friday 5pm push/email: "Anything to log from this week?" (Phase 2.5, once we ship email via Resend.)
- House can enable a Sunday-evening roasting thread where anyone behind on their plan gets to explain themselves.

---

## Phase 3 — Reflect & compare

**Why.** The reflection (the current check-in) now has context: the plan is the benchmark.

### The Sunday reflection

Basically the current check-in wizard, but the slider question shifts: it reads "How did you actually feel about your Fitness week?" and shows your plan fulfillment above it (e.g., `Planned: 3 Gyms · Logged: 2 Gyms · Run: logged 1`). The slider becomes a reality check — did you *feel* like a 9 even though you only hit 2/3 gyms? Interesting.

### The weekly recap card

After reflecting, auto-generate a shareable recap: total life score, per-F completion %, streak, best-of tags. One tap to drop it in the household feed, copy as an image, or (Phase 5) post to iMessage.

### Streak rules (tightened)

A week counts toward your streak if you **planned at least one F** AND **logged at least one activity.** This rewards the whole loop, not just showing up on Sunday.

---

## Phase 4 — Accountability & social layer

This is where the app gets fun for roommates specifically, not just personally.

- **Reactions** — emoji reactions on logs, plans, and weekly recaps. Already scaffolded in the DB. Ships with optimistic UI.
- **Pokes** — tap a roommate's incomplete intention to send a pre-written nudge ("👋 one more gym session, you got this"). Capped at 1 poke per intention per week so it stays friendly.
- **House challenges** — someone proposes "this week we all run once," everyone opts in, the house gets a shared progress bar at the top. Optional loser-picks-dinner type wager field.
- **Birthday-of-the-week energy** — a rotating "hot seat" member gets their card highlighted; everyone else gets a prompt to react.
- **Hall of shame & fame** — month-in-review: who had the longest streak, who had the biggest plan-vs-reality gap, most-improved, etc.

---

## Phase 5 — Polish & push

- **Deploy to Vercel** with a real domain (even a cheap `.fun` or `.house` TLD) so roommates can add it to their home screen as a PWA.
- **Magic-link email styling** through Resend so the first impression isn't a gray Supabase email.
- **Real avatars** — upload a photo on first run.
- **Dark mode.**
- **Week picker** — scroll back through prior weeks as pages, not a flat feed.
- **Export** — download your year as a CSV / neat PDF recap for end-of-year vibes.

---

## Phase 6 — Native iOS

Once the web app has real usage from your house and a couple of others (stretch: 3–5 households, 10+ weekly active users), rebuild the core flows as an Expo / React Native app. The backend (Supabase) stays. Focus first on (a) push notifications Sunday night and mid-week, (b) widget on the home screen showing your plan bars, (c) Apple Health import to auto-log fitness activities.

---

## Sequenced build plan (what I'd actually code, in order)

Each step is roughly 1 focused session:

1. **`weekly_plans` schema + the Sunday planner UI.** Reuses the wizard skeleton, so fastest win.
2. **Home-screen plan cards** (render plans under the leaderboard; dim/fade incomplete intentions).
3. **`activity_logs` schema + the floating Log sheet.**
4. **Plan↔log reconciliation** (fill the progress bars, confetti on complete F).
5. **Reflection flow update** — show plan vs logs inline above the slider; keep the score.
6. **Reactions API + optimistic UI** (already designed; ships in a couple hours).
7. **Deploy to Vercel, polish email, ship to roommates.** This is the "go live" moment.
8. **Pokes + house challenges** — only after the above has been used for 2–3 real weeks so we don't over-design.

---

## Questions worth deciding before we build Phase 1

A few design calls on the planner will shape the whole thing. Worth 2 minutes of thought:

- **Count granularity.** Is a count-based intention (`🏋️ Gym × 3`) always what you want, or do some Fs (Flirt, Fun) feel better as checkboxes without a number? Leaning: counts for Financial/Fitness, checkboxes for Flirt/Fun, user can override.
- **Private vs visible plans.** Are plans visible to the household from Monday (leaning yes — that's the accountability), or only after the week is over? Middle ground: show the tag list and counts, but hide optional notes until the reflection.
- **What happens to unfinished intentions?** Quietly fade? Ask "carry over to next week?" on Sunday planning (leaning yes — that's a great hook).
- **Per-house vs per-person tags.** Should the household be able to define custom tags (e.g., specific to your gym / friend group), or do we keep the curated lists for v1? Leaning: curated in v1, custom in Phase 4.

---

## The vision, written out

A Sunday night, four roommates are in the living room. Someone opens Four Fs on their phone and projects it to the TV. Each person pulls up the planner on their own phone. In five minutes, everyone has set their week: who's hitting the gym, who's going on what date, who's cooking Wednesday, who's saving, who's going out Friday.

On Wednesday, someone taps the `+ Log` button in the kitchen: `💪 Gym`. Their card glows green on the house's shared leaderboard. Their roommate sees it and fires a 🔥 reaction from across the couch.

On Sunday they reflect, see how close reality matched intention, get a weekly recap, and do it again. After a month, the house has a real rhythm — not because the app nagged them, but because nobody wants to be the one with the saddest progress bars.

That's the app.
