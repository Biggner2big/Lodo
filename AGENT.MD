# Ludo Game — Agent Instructions

## MAIN GOAL

Upgrade the existing `final lodo.html` into a polished, smooth, reliable **Ludo Star-level 2-player realtime Ludo game**.

**DO NOT rebuild from scratch.** Audit the existing code first and improve/refactor it while preserving working features.

---

## 1. GAME RULES

* Match has exactly **2 active players**.
* Board must remain a complete **4-color Ludo board**:

  * Red
  * Green
  * Yellow
  * Blue
* Each color has 4 tokens.
* Only 2 colors are active in a match.
* Active color pair must be selected dynamically.
* Never hardcode Red + Yellow.
* Inactive colors remain visible but cannot:

  * roll
  * move
  * capture
  * receive turns
  * affect winner detection.

Support all possible 2-color combinations.

---

## 2. CENTRAL GAME ENGINE

Create/refactor a single deterministic rules engine.

It must control:

* dice rules
* valid moves
* token movement
* 6/base exit
* extra turns
* safe cells
* captures
* home lane
* final home
* winner detection
* turn switching
* rematch state

Never duplicate game rules in UI, animation or networking code.

---

## 3. DICE

Fix all dice problems.

Requirements:

* Correct random dice value.
* Smooth dice animation.
* Display actual authoritative result.
* Prevent rapid double-roll.
* Prevent multiple simultaneous rolls.
* Ignore duplicate network roll actions.
* Roll only during the correct player's turn.
* Correct extra-turn behavior.

---

## 4. TOKEN MOVEMENT

Movement must be smooth and deterministic.

Requirements:

* Animate token **cell-by-cell**.
* Perfect mathematical board alignment.
* Correct path for every color.
* Correct home-lane path.
* Correct final-home position.
* Correct token stacking.
* Tokens must never jump to incorrect cells.
* No shaking.
* No duplicated movement.
* No movement behind the authoritative state.
* Movable tokens must be clearly highlighted.

Animation must never modify game rules.

---

## 5. CAPTURE / SAFE CELLS

Use one centralized safe-cell definition.

Capture must be authoritative.

Requirements:

* Safe cells cannot be captured.
* Opponent token on a capturable cell returns to base.
* Correct capture animation.
* Correct capture sound/feedback.
* Capture must be identical for both players.

---

## 6. TURN SYSTEM

Create a strict state machine.

Example:

`WAITING → ROLLING → ROLLED → MOVING → RESOLVING → NEXT_TURN`

Prevent:

* double turns
* skipped turns
* invalid moves
* stale clicks
* rapid clicking
* duplicate actions
* client-side turn manipulation.

---

## 7. REALTIME MULTIPLAYER

Use authoritative realtime synchronization.

Every action/state should contain:

* `matchId`
* `playerId`
* `actionId`
* `stateVersion`
* timestamp

Requirements:

* Reject duplicate actions.
* Reject outdated states.
* Ignore stale packets.
* Prevent race conditions.
* Prevent both players from acting simultaneously.
* Reconcile local visuals with authoritative state.
* Both players must always converge to the same state.

Handle:

* latency
* packet delay
* reconnect
* disconnect
* abandoned match
* browser refresh
* temporary network failure.

---

## 8. MATCHMAKING

No login/signup.

Use anonymous player identity.

Lobby must show currently available online players.

Flow:

`Lobby → Click Available Player → Direct Match`

Do NOT add:

* friend requests
* accept/reject system
* unnecessary account registration.

Player can set:

* display name
* avatar.

---

## 9. EXISTING FEATURES

Preserve working functionality such as:

* lobby
* profile
* name/avatar
* chat
* sound
* rematch
* leave game
* bot mode
* pass-and-play.

Fix broken implementations instead of deleting them.

Bot and pass-and-play must use the **same central game engine**.

---

## 10. UI / UX

Upgrade the UI to a premium modern Ludo experience.

Requirements:

* clean professional design
* responsive mobile UI
* responsive desktop UI
* smooth transitions
* polished buttons
* clear player HUD
* clear active-player indicator
* dice feedback
* token highlights
* capture feedback
* win animation
* message popups
* clear loading states
* no cheap/unfinished visual appearance.

Do not sacrifice performance for effects.

---

## 11. PERFORMANCE

Target smooth 60 FPS.

Requirements:

* use `requestAnimationFrame` for animations
* avoid unnecessary DOM rebuilding
* avoid excessive realtime updates
* serialize token animations
* cancel/replace obsolete visual animations safely
* prevent memory leaks
* properly unsubscribe/cleanup realtime channels
* avoid duplicate event listeners.

---

## 12. SECURITY

Never trust client input for:

* dice result
* turn
* token movement
* capture
* winner
* game state.

Validate authoritative actions.

Never expose:

* Supabase service-role key
* private keys
* admin credentials.

---

## 13. SUPABASE CONFIG

Supabase configuration must NOT be hardcoded inside the HTML.

Use environment variables.

Expected variables:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

For frontend deployment, only the **public Supabase URL and anon/publishable key** may be exposed to the browser.

Never put a service-role/private key in frontend code.

Keep environment configuration separate from application logic.

Provide a safe fallback/error message when configuration is missing.

---

## 14. CODE QUALITY

Before changing code:

1. Audit existing architecture.
2. Identify duplicate logic.
3. Identify Red/Yellow-only assumptions.
4. Identify multiplayer race conditions.
5. Identify animation/state synchronization problems.
6. Identify disconnect/reconnect problems.
7. Fix the architecture first.
8. Then polish UI.

Do not blindly rewrite working sections.

Keep code modular and readable.

Use clear names and comments only where useful.

---

## 15. TEST ALL COLOR PAIRS

Test every possible active pair:

* Red vs Green
* Red vs Yellow
* Red vs Blue
* Green vs Yellow
* Green vs Blue
* Yellow vs Blue

Verify:

* paths
* home lanes
* token positions
* captures
* safe cells
* turn logic
* winner detection
* animations
* player orientation.

---

## 16. FULL QA

Before finishing, test:

* lobby
* matchmaking
* game creation
* player joining
* dice
* rapid dice clicks
* valid movement
* invalid movement
* 6/base exit
* extra turn
* capture
* safe cells
* home lane
* final home
* win
* rematch
* leave game
* reconnect
* disconnect
* delayed packets
* duplicate packets
* chat
* profile
* bot
* pass-and-play
* mobile layout
* desktop layout
* all 6 color combinations.

Fix discovered bugs before completing.

---

## 17. IMPORTANT DEVELOPMENT RULE

The final result must feel like a **professional realtime Ludo game**, not a basic HTML demo.

Priority order:

1. Correct game rules
2. Multiplayer synchronization
3. Token/dice animation
4. Exact alignment
5. Reliability
6. Performance
7. UI polish

Do not add unnecessary features that make the game unstable.

---

## FINAL REQUIREMENT

After implementation:

* perform a complete self-audit
* search for remaining hardcoded color assumptions
* search for duplicate event handlers
* search for race conditions
* search for animation/state desync
* verify Supabase security
* verify all six color combinations
* fix all discovered issues.

Do not declare the work complete until the existing game has been properly tested and stabilized.
