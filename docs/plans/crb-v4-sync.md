# Plan — CRB v4 sync: the sheet catches up to the 2026-10-07 mirror

**Status:** open, Ken's. P0, P1 (Decision 198), P2 (W71, Decision 194) and P3 (the Werewolf, Decisions 195–197) are built. Ken answered VQ1–VQ15 on 2026-10-08. Next: P3b or P4.
**Compiled:** 2026-10-08, against the mirror at `private/` `cea99a8` (the 2026-10-07 re-mirror under the
four-digit numbers, merged with S10c's Codex fix), game data 0.29 and app 0.37.0.
**The other direction:** `crb-catch-up.md` is what the *book* still needs from the sheet. This plan is what
the *sheet* needs from the book. An item lives in one of the two, never both.
**Ids:** `VQ`_n_ are this plan's questions (§4). P0–P5 are its passes (§2).

**How this was checked.** Every chapter the old mirror had was diffed against its new file
(`041_Archetypes.md` against `0410`–`0414` joined, `042_Skills.md` against `0420`–`0423`), and every
changed passage read against `shadows-data.js`. The skills (all 36, names, stat pairs, categories) and the
spell catalog (all 125, by R14's own parser) were compared by script. Chapters new to the mirror
(`0000`, `0100`, `0450`, `0470`, `0500`–`0520`, the Exceptions List) were read for what touches a
character.

---

## 1. What the re-mirror changed, chapter by chapter

**Legend:** ✅ the sheet already matches · 🔧 the sheet needs it (pass named) · ❓ a question first (§4) · — nothing a character sees

| Chapter | What moved | Sheet |
|---|---|---|
| `0200_Synergy_System` | One phrase ("explained in character creation") | — |
| `0300_Core_Mechanics` | Luck: everyone starts at 4, more at 1 CP; the Credits line drops cyborgs | ✅ Decision 157 |
| `0400_Character_Creation` | Stat Points are the flat 45/50/55/60 pool with the climbing buy; the rolled pool is gone from the book | ✅ Decision 150 · ❓ VQ1 |
| `0410_Archetypes` | Split into `0411`–`0414`. Cyborg is out of the list; **Custom** is in, with Mortal / Supernatural / Other | ✅ Decisions 152–153 |
| `0411_Arcanist` | Heading levels only | — |
| `0412_Professional` | Handguns, Occult Lore, Hardcore Parkour's prerequisites, Cyber-Prophetical; IP is 5 an hour; **"Master of None does not raise your starting rank max"** | ✅ all but F33 · ❓ VQ2 |
| `0413_Vampire` | **Written.** Was a forty-line stub. Scaling table (Stat Bonus, SFR, RoU, Base Powers, Max Starting Rank), baseline traits, three Bloodlines (Strigoi, Upyr, Draugur), The Thirst (Hunger, Feeding), Innate and Bloodline powers **with ranks to 5**, Vulnerabilities, Growth | 🔧 P4 · ❓ VQ4, VQ5 |
| `0414_Werewolf` | **Rewritten.** Origins are Trueborn, **Wildblood** and Forge Fang, each with Shifting, Refuel, Need and a Starter Power; baseline traits (Feral Instincts, Regeneration, Pack Mentality); Werewolf Form; SFR refills three ways; Call of the Wild's withdrawal steps; five Innate and eighteen Origin powers **with ranks to 3**; Base Powers and Max Starting Rank columns | ✅ **P3** (Major Milestones: P3b) · F38 stubbed |
| `0420`–`0423` Skills | Split three ways; Skill Points are base + INT + REF; Max Skill Rank is **4 / 5 / 6 / 6** | ✅ skills match by script · ❓ VQ6 |
| `0430_Advantages` | CP 5/10/15/20; "Universal" defined; Long-Lived's ranks stack; Ghost TAG is "a Black TAG" on the street | ✅ rules · ✅ P1 (two descriptions) |
| `0440_Disadvantages` | Minor Insanity buys out between sessions | — |
| `0450_Advancement` | **New to the mirror.** IP 5 an hour; prices for Powers (×20), a new Power (40), Advantages and buy-offs (×10 a rank), SAN (5 a point), Health Levels (25); IPE; new Minor Milestones (Skilled, Improved 3d10+30, Talented, Redeemed, Honed, **Steadied**), and they repeat; a Training option | 🔧 P2 (powers), P5 (the rest) · ❓ VQ7 |
| `0460_Gear` | Massive no longer "deals double"; **Blast** is defined; the grenade table gains 1x / 2x+ and Defense columns and new notes; the old Conditions table is gone | ✅ P1 (VQ8) · F28 and F29 closed (VQ9) |
| `0470_Cybernetics` | **New to the mirror.** Still an outline, written for the Cyborg | — waits on the cybernetics design (STATE §3) |
| `0480_Magic`, `1200_Powers`, `0540`, Appendix_Aberrations | Unchanged | — |
| `0530_Combat_Encounters` | Massive also inflicts Injured and Maimed | ✅ CQ5 |
| `0550_Downtime` | Exhaustion is Arcanists only; SAN recovers **5% a day**, not an hour; a Training callout | — the sheet computes neither |
| `Appendix_Book_of_Known_Spells` | Counterspell and Silence gain printed durations; Silence's 1x is "1 round"; Consecrate drops cyborgs; the four traps print in both parts | ✅ **P0** fixed the four fields |
| `0500`–`0520` | **New to the mirror.** Playing the Game, Social and Environmental Encounters | — GM mode reads them later (W29) |
| `___TO_UPDATE_…Exceptions_List` | **New to the mirror.** The team's tracker, 2026-09-29. AD-05 (TOL) is stale: 0200 and 0400 already print INT + BOD + COOL | — `crb-catch-up.md` tracks it |

---

## 2. The passes

Each pass is a branch and a PR. They're ordered by what unblocks what, not by size.

| Pass | What | Tier | Waits on |
|---|---|---|---|
| **P0** | The mirror moves: `private/` to `cea99a8`, live citations to four-digit names, R13/R14/CRANK read the new files, the four spell fields | Docs + Fix | ✅ **Built** 2026-10-08, app 0.37.1 (released with P2 as 0.38.0) |
| **P1** | Small content: the rolled Stat Point pool as an opt-in (VQ1); Long-Lived's "ranks stack" and Ghost TAG's Black TAG line in their descriptions; the grenade table's 1x / 2x+ and Defense as catalog text; the grenades as printed (VQ8) | Content | ✅ **Built** 2026-10-08: Decision 198 (the rolled pool a box), app 0.39.0, no data bump (Decision 68: nothing computed moves) |
| **P2** | **W71: every power has a rank, and Progression raises one with IP.** Disciplines and Custom powers first, so P3 and P4 fill a shape that already works | Rule or shape | ✅ **Built** 2026-10-08: Decision 194, app 0.38.0, schema 0.18 |
| **P3** | **The Werewolf to `0414`**: Origins, baseline traits, Werewolf Form, SFR's three refills, Call of the Wild, every power as data with its ranks. Closes the Werewolf half of F7 | Rule or shape | ✅ **Built** 2026-10-08: Decisions 195–197, app 0.39.0, game data 0.31. Work order: [`crb-v4-sync/P3-werewolf.md`](crb-v4-sync/P3-werewolf.md) |
| **P3b** | **The Werewolf's Major Milestones** (VQ13): `0414`'s 29, archetype Majors read at all, an Origin prerequisite, and the few that change a derived number | Rule or shape | Ken on VQ16–VQ19. **Work order: [`crb-v4-sync/P3b-werewolf-majors.md`](crb-v4-sync/P3b-werewolf-majors.md)** |
| **P4** | **The Vampire to `0413`**: from `tbd` to `draft`. Bloodlines, The Thirst, Innate and Bloodline powers, Cursed Evolution, Vulnerabilities | Rule or shape | P2; F39 (stubbed if open). Ken on VQ20–VQ27. **Work order: [`crb-v4-sync/P4-vampire.md`](crb-v4-sync/P4-vampire.md)** |
| **P5** | **Advancement to `0450`**: IP by the hour, the new IP purchases (Advantages, buy-offs, SAN, Health Levels), the new Minor Milestones and repeats, Training | Rule or shape | 0450's own open questions (AD-02, AD-03) for the prices; the repeat rule (VQ7) can go now |

**P0 fixed, beyond the rename:** R14 now reads a trailing `\` as pandoc's hard line break (the
2026-10-07 pull prints one on some entries) and accepts a spell with no Threshold or Overflow
(Counterspell), and the catalog takes the book's text for Counterspell's and Silence's durations,
Silence's 1x and Consecrate.

---

## 3. What P2 to P4 share: a power with ranks

The Werewolf and Vampire chapters give every power the same shape: **Power · Cost · Effect · Per
Rank**, where Per Rank says what a rank adds and its maximum ("+1 TH (max 5)"). Some say "None"
(Preternatural Speed has no ranks); a few step at named ranks instead ("Rank 2: anywhere; Rank 3:
anytime"). The Arcanist's Disciplines already have ranks. A Custom power is text.

So P2 builds the rank once, and the archetypes fill it: a power entry in the data carries its rank
range and its per-rank text, the character stores the rank it holds, and Progression prices the next
one from `0450`. P2 is the proposal Ken signs off before anything is built.

---

## 4. Questions

VQ1–VQ9 went to Ken on 2026-10-08, and VQ10–VQ15 (from P3's work order) the same day. Answers are
in the third column; two parts went on to Deighton and Scott as flags. VQ16–VQ19 are P3b's and VQ20–VQ27 P4's, in their work orders.

| Id | Question | Answer |
|---|---|---|
| **VQ1** | `0400` prints only the flat Stat Point pool. The sheet still offers the rolled pool (5 below + 1d10) as the GM's pick (Decision 150). Keep it? | **Keep it, as an option.** The CRB goes with flat; rolled is there for a GM who wants it, perhaps as a tickbox in the creator rather than an equal choice. P1 looks at the Power Level step's control |
| **VQ2** | `0412` says "Master of None does not raise your starting rank max". Does F33 close? | **Yes. F33 closed.** The sheet already behaved this way; the stub became the rule and the benefit says so |
| **VQ3** | What do a Werewolf's **Base Powers** (1 / 2 / 2 / 3) buy, when it carries every power at Rank 1? | **Open: F38**, for Deighton and Scott. P3 stubs it |
| **VQ4** | Is one Vampire Base Power one rank? Is Cursed Evolution's second bloodline the New Power price? | **New Power price, yes.** The Base Powers half is **open: F39**, for Deighton and Scott. P4 stubs it |
| **VQ5** | How do the archetype's power maximum, its Max Starting Rank and the Power Level's Max Power Rank fit together? | **Every written cap is a creation cap.** In play a power stops at **10**, as stats and skills do (IPE). That may change for supernaturals (`0450`'s open question), so the cap is data |
| **VQ6** | WCD's Max Skill Rank: the book's 6 or Decision 150's 7? | **7.** The book is behind; `crb-catch-up.md` carries the edit |
| **VQ7** | `0450`'s Minor Milestones: build now, and do they repeat? | **Any Minor Milestone, any time.** Each one reached lets you pick any of them; you don't have to take them all before repeating. That supersedes Decision 29 in part, in P5 |
| **VQ8** | Grenades' 1x / 2x+ column escalates to Injured without Massive (CQ5). Show it as printed? | **Yes**, as printed |
| **VQ9** | Do the book's Blast and Suppression close F28 and F29? | **Yes, closed for now.** Playtests may reopen them |
| **VQ10** | Retire Lunar Phase Blessing's Resilient Spirit (Natural Armor under a waning moon)? | **Yes, retire it.** Decision 196 |
| **VQ11** | Compute Werewolf Form? | **Yes, and a shift that costs an HL (Forge Fang) takes it.** Decision 195 |
| **VQ12** | Call of the Wild: a tracker or text? | **A stepper panel.** Decision 196 |
| **VQ13** | Werewolf Major Milestones in P3? | **Scope it; a follow-up session is fine.** P3b's work order |
| **VQ14** | The powers' printed max 3: shown, or a cap in play? | **Printed caps are for creation; play stops at 10. May be revisited**, so Decision 196 flags it |
| **VQ15** | Aspect of the Beast and CyberWolf Protocol: reference tables or stored picks? | **Reference tables.** Decision 196 |

**For the book, not the sheet** (noted here because the diff found them): `0422_Utility_Skills.md`
carries the sixteen General skills after the Utility ones, so they print twice across `0422` and
`0423`; and the inscribed **Consecration** still says "cyborgs" where Consecrate no longer does.
Both are in `crb-catch-up.md`.
