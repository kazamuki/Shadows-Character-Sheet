# Voice — App Strings

How the Shadows voice applies to a *user interface*.

**Status: draft, 2026-09-02.** Written by Claude from `reference/GUIDE_Shadows_Voice.md`
and submitted to Ken for correction. The structure is settled; the example
sentences are proposals. Every player-facing string it governs lives in
`shadows-data.js` under `appCopy`, so rewriting them is a data edit — you never
have to touch code to change the app's voice.

---

## Why this file exists

`GUIDE_Shadows_Voice.md` is written for **rulebook prose** — sections, flavor,
lore, GM guidance. It holds in the app, and its core rule is not negotiable
here either:

> Shadows always speaks as the world itself — never as a detached designer or
> instructor.

But an interface has a surface the rulebook never has to think about. App
strings are read under time pressure, they repeat on every render, they sit
beside numbers, and **some of them have to be unambiguous instructions.** A
validation error that is atmospheric but unclear is a bug, not voice.

So the app has two registers, and the whole discipline is knowing which one
you're in.

---

## The test

> ### Is the player stuck right now?
>
> **Yes → tool voice.** They need out, and prose is in the way.
> **No → city voice.** Nothing is wrong; there is room for the world.

That is the entire rule. Everything below is worked examples of it.

A second question catches the failure mode this app actually had:

> ### Does this sentence describe the world, or the software?
>
> If it describes **the software** — its phases, its roadmap, its internal
> flags, what "ships" — it is designer voice and it should not exist in the
> product at all. Not rewritten. Removed, or replaced by a state the app
> renders.

---

## City voice

**Where:** empty states · step notes · input placeholders · flavor, lore and
descriptions carried in the data · moments of commitment · the copy that says
something isn't finished yet.

The city asserts. It does not hedge, apologise, or explain itself. Per the
guide: replace *can / might / sometimes* with *does / will / tends to*.

Already in the app and already right — these are the model, not aspirations:

- `"What shaped them? What do they owe, fear, or want?"` — history placeholder
- `"What the city did to you this time"` — session title placeholder
- `"Leads, debts, names to remember"` — session notes placeholder

**The highest-value string in the app is the lock screen.** It is the emotional
peak of creation — the player is about to commit — and it is the one place
worth spending real writing on:

> Locking finalizes creation. The exported `.shadows.json` is the character —
> keep it, share it, bring it to the table.

Three beats, escalating, landing on the table. Note what is *not* there any
more: a fourth sentence about session tracking arriving in Phase 3, which
stepped on the ending and described the software rather than the world.

---

## Tool voice

**Where:** validation errors · destructive confirmations · import and file
failures · field labels · buttons · anything the player reads while blocked.

Rules:

1. **Say what is wrong and what fixes it.** Both halves, in one sentence.
2. **No atmosphere at someone who has lost work.** A failed import is not a
   dramatic moment; it is a person about to lose a character.
3. **A control says exactly what happens.** "Lock & Export" — then it locks and
   exports.
4. **Name things the way a player recognises them**, not the way the system is
   built. A player has *Character Points*, not a `cp.left` balance.

Already right — this is the model:

> `Pick 3 Combat Skills for your Focused Skills (1/3).`

The player is stuck; that sentence tells them exactly what unsticks them, and
carries a progress count so they can see how far off they are. It needs no
atmosphere and would be worse with it.

---

## The fourth category: things that aren't finished

This is the register nobody had designed, and it is where the app kept leaking
its own build state at players — *"Session tracking arrives in Phase 3"*,
*"this archetype ships as TBD"*, *"F14 — pending a ruling from D."*

**A player is not a stakeholder.** They do not know what a phase is, what ships,
what TBD means, or who D is. But they do need to know that a rule in front of
them is not settled, because they have to play anyway.

So: **city voice, and it names the consequence, not the schedule.**

| Don't say | Say |
|---|---|
| what phase it lands in | that it isn't written yet |
| "ships as TBD" | what the player does in the meantime |
| the flag id, the field path, "confirm with D" | nothing — that stays in `flagNote` |
| "coming soon" | nothing. The app makes no promises about its own future. |

The shape that works: **state the gap, then hand the table its authority.**

> The Bloodlines aren't written yet. Your character file remembers that.

> This rule is still being written. Until it is, it's your GM's call.

The guide backs this — *"Reassurance Without Softness"*: acknowledge the
uncertainty, don't apologise for it. The city doesn't apologise for being
unfinished any more than it apologises for being dangerous.

---

## Where player-facing strings actually live

Three places, and the second one surprises people:

1. **`src/ui/app.js`** — the obvious one. Renderers and templates.
2. **`src/engine/engine.js`** — `validate()` writes copy. Every wizard error and
   warning a player reads is composed there, not in the UI. Its messages are
   otherwise the best tool voice in the codebase — *"Pick 3 Combat Skills for
   your Focused Skills (1/3)"* — but this is where a build-state sentence hid
   the longest, because nobody looks for prose in the rules engine.
3. **`src/data/shadows-data.js`** — descriptions, flavor lines, `playerNote`,
   and everything under `appCopy`.

The enforcement test renders the whole app, so it catches all three regardless
of which file the string came from.

## How this is enforced

Voice standards decay when they depend on people remembering them. Two
structural rules do the remembering instead:

1. **Two fields, two audiences.** `flagNote` is maintainer-facing — flag ids,
   field paths, "confirm with D" — and **never renders**. `playerNote` is the
   short in-voice line, and is the only thing the app can show. A test asserts
   no `flagNote` string reaches rendered HTML.

2. **Status, not sentences.** "Not finished" is a data state, not a sentence
   someone has to remember to delete. The words for each state live once, in
   `appCopy`, and every site renders from there.

Together these mean the failure mode that produced this file — a maintainer
note reaching a player — is no longer something you can do by accident.

---

## Checklist

Adapted from the guide's §9, for strings:

- Is the player stuck? Then be clear, and stop.
- Does this describe the world, or the software?
- Does it hedge where it could assert?
- Could this sentence exist inside NYTE City?
- Does it promise anything about the app's future? Delete that.
- Does it leak an id, a phase, a field path, or a person's name?

*If it sounds like NYTE City talking — and the player isn't stuck — it's right.*
