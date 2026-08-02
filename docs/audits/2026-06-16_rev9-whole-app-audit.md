# Character Sheet — Whole-App Audit (rev 9 smoke test)

**Scope:** full read of `index.html` (3,107 lines) against `SCHEMA.md`, `shadows-data.js`, and `shadows-icons.js`, plus a live boot-and-drive smoke test in jsdom.
**Verdict:** structurally healthy. The engine is clean, isolated, and behaves. Findings concentrate in one area — the archetype *specialization* model — which is also exactly where the Biomech rewrite and your adv/disadv feature request are heading. Fix that seam first and the next two phases get easier.

Line numbers refer to the uploaded `index.html`.

---

## 0. What the smoke test actually did

Booted the file in jsdom (inlined `shadows-data.js` + `shadows-icons.js` first, which both replicates a real browser's blocking script order *and* exercises your documented "ship path" single-file build).

- ✅ Boots clean — **0 runtime errors** on load; Home renders.
- ✅ Full wizard walkthrough: power level → concept → stats → archetype, Continue-gating respected.
- ✅ Imported a locked character and rendered **all 9 tabs + Admin mode — 0 runtime errors**.
- ✅ `commit → audit → undo` round-trips: +5 damage produced one audit entry ("Damage +5"); undo restored damage to 0 and emptied the log.
- ✅ The app's `try/catch` storage guards held up under jsdom's opaque-origin localStorage (it rendered fine with storage unavailable). Nice.

Three findings below were confirmed empirically during this run, not just by reading. They're tagged **[verified]**.

---

## 1. The big one — the specialization model has drifted

There are now **two parallel models** for "the required pick(s) that define an archetype," and the renderers special-case each archetype instead of sharing one. This is the root of the next three items.

- Single-select: stored in `identity.specialization` **and** `archetypeChoices.subtype` (Professional subtypes, Werewolf Origin).
- Multi-select-by-count: stored in `archetypeChoices.aberrations` (Arcanist).

The data already points at the unification: the Arcanist's specialization carries `countBy: "campaignPowerScaling.aberrations"`, but the generic renderer ignores it.

- [ ] **A1 — Arcanist renders its aberrations twice, both required. [verified]**
  `renderArchetype` runs the *generic* specialization block (single-select, `data-spec`, sets `identity.specialization`, required by `validate` at 1065–1067) **and** the *Arcanist-specific* block (multi-select, `data-aber`, "choose N", required at 1078–1080). Smoke test: **6 `data-spec` buttons + 6 `data-aber` buttons** for the same six aberrations. A player must pick one aberration up top *and* N below to clear validation. (Renderers: 1441–1464 + 1480–1488. Binds: 2641–2651.)

- [ ] **A2 — The sheet's Specialization section can't see non-Arcanist picks. [verified]**
  `renderShArchetype` reads only `ch.archetypeChoices.aberrations` (2055–2063). For a Professional, the Archetype tab header correctly shows "Professional · cleaner" (from `identity.specialization`) but the **Specialization section below shows "none chosen."** Same will hold for the Werewolf Origin (single-select, 1 option). Verified for Professional; structurally identical for Werewolf.

- [ ] **A3 — Unify into one selection concept (the actual fix for A1+A2).**
  One generic specialization model the renderer reads once and the sheet displays generically:
  - `selectMode: "single"` (Professional, Werewolf) or `selectMode: "count"` with `countFrom: "<scaling path>"` (Arcanist).
  - Store the result in **one** place — e.g. `archetypeChoices.specialization: [...ids]` (length 1 for single-select) — and derive `identity.specialization` from it for display rather than maintaining both.
  - Delete the Arcanist/Professional/Werewolf special-case branches in `renderArchetype` and the aberration-only branch in `renderShArchetype`.
  This is the same machinery the **Biomech "Chrome Loadout"** will want. Build it once now and Biomech becomes a data entry, not a fourth branch.

---

## 2. Functional / correctness — small but real

- [ ] **B1 — Stale copy. [verified by reading]** `renderReview` ends with "Session tracking arrives in Phase 3." (1687) — Phase 3 shipped three sub-phases ago. Drop or update.

- [ ] **B2 — Two dead stat aliases.** `STAT_ALIASES` maps `MOVEMENT→"MA"` and `ATTRACTIVENESS→"ATTR"` (678), but the real ids are `MOB` (Mobility) and `MAG` (Magnetism). Both aliases resolve to ids that don't exist, so a skill referencing "Movement"/"Attractiveness" would still trip the unknown-stat flag. Point them at `MOB`/`MAG`, or drop them if no legacy data uses those names.

- [ ] **B3 — `levelsPerBOD` is an authoritative-looking knob the engine ignores.** `health()` hardcodes 1 HL per BOD via `Math.min(bod, maxLevels)` (591); `resources.healthLevels.levelsPerBOD: 1` in the data does nothing. If a designer ever set it to 2, the sheet wouldn't budge. Either honor it in `health()` or remove it from the data so it doesn't read as a live setting.

- [ ] **B4 — `Engine.undoIP` is now dead.** Decision 49 retired the ad-hoc IP undo for the global undo; `undoIP` (794–807) is still defined and exported (1185) but never called. Safe to delete, or leave a one-line "superseded by undoLastAction" note.

- [ ] **B5 — Review step number is hardcoded.** `STEPS` appends `{id:"review", n:8}` (1215) and assumes `creationFlow.steps` has exactly 7 entries. It does today, so "Step 8 of 8" is correct — but if a step is ever added/removed in the data, the number desyncs. Derive it: `n: D.creationFlow.steps.length + 1`.

- [ ] **B6 — Unlocked-draft import is a shallow merge.** `Object.assign(Engine.newCharacter(), c)` (1723) lets a *partial* nested object from an old draft survive — e.g. an `archetypeChoices` missing `disciplines` would replace the full default and could throw in `renderArchetype`. `migrate()` backfills trackers/progression but not `archetypeChoices`/`creation` sub-objects. Low likelihood (only pre-0.2 drafts), cheap to harden: deep-default `archetypeChoices` in `migrate()`.

---

## 3. UX / consistency observations (not bugs — forward notes)

- [ ] **C1 — Sheet number inputs vs. the caret fix.** Decision 41's caret fix applies to the five creation roll inputs. Sheet number fields (`data-dmgset`, `data-sanset`, `data-adjamt`, `data-cramt`, `data-ipamt`) are `type=number` committing on `change` (blur/Enter), so there's no live caret bug today — focus has already left when the re-render fires. Flagging only so that if any sheet number field ever moves to live `oninput` commit, it inherits the same fix.

- [ ] **C2 — Admin can't reach archetype-specific choices.** Admin mode edits identity/power level/archetype/stats/skills/traits/LUCK, but not `archetypeChoices` (aberrations, disciplines, focus/stat-bonus allocations). The only way to change those post-lock is to switch archetype, which wipes them. For a true "fix anything" mode, an `archetypeChoices` editor would close the gap. Lower priority — and it gets much easier once §1 unifies the model.

- [ ] **C3 — `panelMax` / SFR display.** SFR shows `left/value` with manual-max fallback; works, but the SFR panel and the Werewolf form toggle still say automation "lands with the archetype rules." That's correct given F6/F7 are open — just confirm the copy stays accurate after the Biomech/Vampire rules land.

---

## 4. Feature design — "smart" advantages & disadvantages

You asked to flag adv/disadv with structured behaviors: (1) taking one **locks** another, (2) taking one requires **freeform text**, (3) per rank you must **pick a skill**. Current entries only carry `cost / pointsGranted / maxRank / description / flagged` — so this is greenfield, and it shares a backbone with the §1 specialization fix. Build one selection/constraint system, use it in both places.

### Proposed data shape (`shadows-data.js`)

Mirrors the existing milestone `prerequisites` pattern so the engine stays consistent:

```js
{
  id: "favored-weapon", name: "Favored Weapon", cost: 2, maxRank: 3,
  description: "...",

  // (1) mutual lock — taking either makes the other unavailable
  excludes: ["combat-paralysis"],

  // optional gating, same vocabulary as milestone prereqs
  requires: { skills: { any: [["handgun", 2]] }, stats: { REF: 6 } },

  // (2)+(3) inputs the player must supply when this is taken
  picks: [
    { id: "skill", label: "Favored Skill", type: "skill",
      from: "combat", perRank: true, count: 1 },   // one skill per rank
    { id: "detail", label: "Describe it", type: "text", required: true }
  ]
}
```

### Proposed character storage (`*.shadows.json`)

Extend the existing adv/disadv entry — no new top-level field:

```js
advantages: [
  { id: "favored-weapon", rank: 2, notes: "",
    selections: { skill: ["handgun", "melee"], detail: "Off the books." } }
]
```

### Engine work (all pure, testable, lives between the markers)

- `optionLock(ch, kind, id) → { locked, by }` — true if any current selection's `excludes` names `id` (symmetric). The CP renderer disables the stepper and shows `by` in the tooltip, reusing the existing `⛔ + title` pattern from boosts.
- Extend `validate("character-points", ch)` to error when: a `requires` is unmet, a `required` text pick is empty, or a `perRank` skill pick count ≠ rank. Surfaces in the same issues list you already render.
- `selections` flows through `diffChar` for free (it's just nested data), so audit/undo and admin edits cover it with no extra work.

### UI work (`renderCP`, sheet `renderShTraits`)

- When an adv/disadv is selected, render its `picks` inline under the card: a skill `<select>` per required slot (sized to rank for `perRank`), a text input for `text` picks. Bind into `entry.selections`.
- On the sheet, show the resolved selections in the trait's expanded card ("Favored Skill: Handgun, Melee").

### Why this is the same system as §1

A specialization option *is* a constrained pick: `selectMode:"single"` ≈ one `pick`; `selectMode:"count"` ≈ a `pick` with `count` from a scaling path. Building `picks` + `optionLock` + the validate hooks gives you the infrastructure to retire the archetype special-cases at the same time. One system, three payoffs (adv/disadv smarts, specialization unification, Biomech-ready).

---

## 5. Where this stands — and where I'd point it next

**The architecture is doing its job.** "Store inputs, compute everything else" isn't just tidy on paper — it's why the audit/undo subsystem could be *generic* (a structural diff of the whole character) instead of a pile of per-action inverse handlers, why an IP spend cascades through every downstream total with no cascade code, and why the sheet survives a game-data change. That decision is the spine of the whole thing and it's holding weight. The engine is well-isolated, the public API matches its callers exactly, and nine tabs of UI render off it without a single runtime error. For rev 9, that's a strong place to be.

**The one debt is the archetype seam.** Everywhere else the app is data-driven; the archetype step is where it reaches for `if (sel.id === "arcanist")` / `"professional"` / `"werewolf"` branches. That's the only place bugs clustered in this audit (A1, A2), and it's not a coincidence — bespoke branches are where models drift apart. The `panels` concept already proves the generic approach works for the *sheet* side of archetypes; the *creation* side hasn't gotten the same treatment yet.

**So my suggested sequencing:**

1. **Resolve F8** (the four-number stat-roll edit) whenever Deighton rules — it's the only thing blocking the wizard and costs nothing once decided.
2. **Build the selection/constraint system** (§4) as the adv/disadv feature you already want. Ship it for adv/disadv first; it's self-contained and high-value at the table.
3. **Retrofit specialization onto it** (§1 A3) — unify the model, delete the three branches, fix A1/A2 as a side effect.
4. **Then the Biomech rewrite** lands as data ("Chrome Loadout" = a specialization with picks; NCI tiers / augment slots = panels) instead of a fourth special case.

Doing 2→3 before 4 means Biomech is the first archetype authored *entirely* through the generic system — which is the real test of whether the rulebook can run without Deighton in the room. If a designer can describe Biomech in `shadows-data.js` and the app just renders it, that's the whole project's thesis proven.

Quick wins to clear whenever (low risk, no design input needed): **B1, B2, B4, B5.** **B3** and **B6** want a one-line "is this intended?" before touching.
