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

---

# Carrom Game — Implementation Instructions

## CARROM MAIN GOAL

Add a complete, polished, original Carrom game to the existing Ludo application.

The existing Ludo game must continue working exactly as before. Do not replace, rewrite, or tightly couple Ludo rules with Carrom rules.

The lobby must show a dedicated **Carrom** game card alongside the existing Ludo modes. Carrom must support the same quality of multiplayer flow already available in Ludo:

* local pass-and-play
* online room create/join
* anonymous player identity
* player name and avatar
* realtime turns
* chat and reactions where appropriate
* leave game
* rematch
* reconnect and disconnect handling
* win screen and return to lobby.

Use the current project architecture and existing Supabase configuration. Do not introduce login, signup, paid assets, or a second unrelated lobby system.

---

## 1. LOBBY INTEGRATION

Add a clearly visible Carrom card in the existing lobby.

The card must:

* use a distinct Carrom icon and title
* explain that it supports 2 players
* open Carrom mode selection without breaking Ludo mode selection
* preserve the current lobby profile, online presence, settings, and player list
* make the selected game type visible in the room flow
* prevent a Ludo room from accidentally starting as Carrom or vice versa.

Use a game type in room and presence data:

```js
gameType: 'ludo'
gameType: 'carrom'
```

Filter or label available players and rooms by game type. Existing Ludo rooms must remain compatible with existing Ludo clients.

Suggested navigation:

`Lobby → Carrom → Local / Create Room / Join Room → Carrom Match`

Do not duplicate the entire lobby. Reuse existing modal, profile, status, and navigation patterns where possible.

---

## 2. CARROM MODULE BOUNDARIES

Create separate Carrom modules. Keep Ludo modules unchanged except for shared navigation/network extensions that are genuinely required.

Recommended files:

* `src/carrom-constants.js`
* `src/carrom-engine.js`
* `src/carrom-physics.js`
* `src/carrom-ui.js`
* `src/carrom-network.js` only if the existing network abstraction cannot cleanly support typed matches.

The Carrom engine must be usable without the DOM. The same engine must power local, online, and future bot modes.

Do not put scoring, collision, turn, foul, queen, or winner rules inside HTML event handlers or rendering code.

---

## 3. STANDARD CARROM BOARD

Implement a complete standard Carrom board, not a decorative demo.

Board requirements:

* square responsive board
* four corner pockets
* proper baseline and striking circles
* four shooting zones
* center circle
* queen starting position
* nine white coins
* nine black coins
* one striker
* visible board boundaries and collision rails
* mathematically stable coordinates independent of viewport size.

Use SVG or Canvas consistently. SVG is preferred if it matches the current board rendering style, but physics coordinates must remain in a normalized coordinate system rather than using CSS pixels.

All board geometry must be centralized in `carrom-constants.js`.

---

## 4. CENTRAL DETERMINISTIC CARROM ENGINE

Create one authoritative deterministic rules engine.

The engine must control:

* match initialization
* player colors and turns
* striker placement
* legal shooting position
* shot validation
* coin and striker positions
* velocity and friction steps
* wall reflection
* coin-to-coin collision
* coin-to-striker collision
* pocket detection
* scoring
* queen ownership and cover rule
* fouls
* turn continuation
* board reset behavior
* winner detection
* rematch reset.

Rendering and animation must only display engine state. They must never decide whether a coin was pocketed, whether a foul occurred, or who won.

Use fixed timestep simulation for deterministic results. Do not depend on frame rate or `Date.now()` inside collision calculations.

---

## 5. CARROM RULES

Implement recognizable standard Carrom rules with clear, consistent behavior.

### Coins and turns

* Two active players only.
* Players are assigned white or black coins.
* A player may shoot only during their own turn.
* A successfully pocketed own coin grants another turn.
* A miss passes the turn after all pieces stop moving.
* A shot cannot begin while another shot is resolving.

### Queen

* The red queen starts in the center.
* Pocketing the queen places it in a pending state.
* The player must pocket one of their own coins in the same turn or the immediately defined cover window to keep the queen.
* If the queen is not covered, return it to the center before the next valid turn.
* Queen ownership and cover status must be identical for both clients.

### Fouls

At minimum support:

* striker pocketed
* illegal striker placement
* shot attempted outside the player's turn
* shot attempted while pieces are moving
* malformed or excessive shot power
* out-of-bounds shot data.

A striker foul must return a previously pocketed coin when the rules state one is available, or apply the configured penalty if none is available. The penalty must be centralized and tested, not improvised in the UI.

### Winning

Use a complete and explicit victory rule. A player wins only after:

* their required coins are cleared
* queen requirements are satisfied
* no unresolved foul or pending cover state remains.

Tie and impossible-state behavior must be defined rather than left to client timing.

---

## 6. SHOT INPUT AND PHYSICS

The player must be able to aim and shoot naturally on desktop and mobile.

Input requirements:

* select a legal baseline position
* drag or point to aim
* show an aim guide
* show power feedback
* clamp striker movement to legal shooting zones
* release to shoot
* support mouse, pointer, and touch input
* prevent accidental scrolling or double shots.

Only normalized shot intent should be sent over the network:

```js
{
  type: 'carrom_shot',
  matchId,
  playerId,
  actionId,
  stateVersion,
  baseline: 0.5,
  angle: 1.42,
  power: 0.78
}
```

Never send client-computed final coin positions as authoritative data.

Physics must include:

* circle collision detection
* conservation-like velocity exchange suitable for a playable board
* friction and sleep threshold
* wall bounce
* pocket capture radius
* simultaneous collision handling
* stable ordering for equal-time events.

Keep the physics satisfying and responsive, but prioritize determinism and fairness over unnecessary realism.

---

## 7. REALTIME MULTIPLAYER

Reuse the existing Supabase realtime pattern, adding an explicit Carrom game type and action protocol.

Every Carrom action and state must include:

* `gameType: 'carrom'`
* `matchId`
* `playerId`
* `actionId`
* `stateVersion`
* timestamp.

The host or designated authoritative side must validate:

* player identity
* turn ownership
* action freshness
* baseline range
* angle range
* power range
* match phase
* current state version.

Reject:

* duplicate shots
* stale shots
* shots from spectators or the wrong player
* shots during simulation
* manipulated score or coin positions
* invalid winner claims.

Broadcast authoritative shot results or a deterministic state snapshot after resolution. Both clients must converge to the same final state.

Handle:

* delayed packets
* duplicate packets
* reconnect
* browser refresh
* player leaving mid-shot
* abandoned rooms
* temporary Supabase errors.

Use a separate channel namespace or a type-safe room payload so Carrom traffic cannot be interpreted as Ludo traffic.

---

## 8. CARROM STATE MACHINE

Use an explicit state machine:

`WAITING → AIMING → SHOOTING → SIMULATING → RESOLVING → NEXT_TURN → FINISHED`

Rules:

* Only the current player may enter `AIMING`.
* Only a validated shot may enter `SHOOTING`.
* No input is accepted during `SIMULATING`.
* Scoring, queen cover, foul, and turn changes happen only in `RESOLVING`.
* A finished match cannot accept shots.
* Rematch creates a clean new state and action history.

---

## 9. CARROM UI / UX

Build a premium game screen consistent with the existing application while giving Carrom its own visual identity.

Required UI:

* player cards for both players
* coin color indicator
* score and remaining coins
* queen status
* current-turn indicator
* shot power control
* aim line
* connection status
* leave button
* chat access where supported
* foul feedback
* pocket feedback
* queen and cover feedback
* win overlay
* rematch and lobby actions.

Use meaningful animation for:

* shot release
* coin movement
* pocketing
* queen return
* foul
* turn transition
* victory.

Do not use animation as a substitute for missing game logic. Keep the board readable on small screens and prevent controls from covering pockets or baselines.

---

## 10. PERFORMANCE AND CLEANUP

Target smooth 60 FPS during local physics and visual playback.

Requirements:

* fixed physics timestep
* `requestAnimationFrame` only for presentation
* no unbounded animation loops
* stop simulation when all pieces are asleep
* avoid rebuilding the entire DOM every frame
* clean up pointer listeners on exit
* unsubscribe Carrom channels on leave, win, and reconnect replacement
* clear timers and animation frames
* do not leave Ludo listeners active in Carrom mode.

---

## 11. SECURITY AND TRUST BOUNDARY

Never trust the client for:

* coin positions
* pocket results
* score
* queen ownership
* foul results
* turn changes
* winner state.

Do not expose a Supabase service-role key or any private credential. Continue using only the public URL and anon/publishable key in browser configuration.

Validate all network payloads before applying them to the engine. Escape player names and chat content using the existing safe display helpers.

---

## 12. TESTING REQUIREMENTS

Add focused deterministic tests for:

* initial board setup
* legal and illegal striker positions
* legal and illegal shot ranges
* wall collisions
* coin collisions
* pocket detection
* striker foul
* queen pocket
* covered queen
* uncovered queen return
* extra turn after own coin
* turn switch after miss
* score updates
* winner detection
* duplicate shot rejection
* stale state rejection
* reconnect state restoration.

Run integration checks for:

* Carrom card appears in the lobby
* local two-player match starts
* online room create and join work
* two clients see the same resolved shot
* leave returns to lobby
* rematch resets all pieces
* Ludo local, bot, online, chat, and lobby flows still work.

Test desktop and mobile pointer input. Test malformed network payloads and rapid repeated clicks.

---

## 13. IMPLEMENTATION ORDER

Follow this order:

1. Audit current lobby, entry point, network manager, and teardown flow.
2. Add game type support without changing Ludo behavior.
3. Add Carrom lobby card and mode routing.
4. Build pure Carrom constants and deterministic engine.
5. Add local board rendering and local pass-and-play.
6. Add pointer aiming, striker movement, and shot simulation.
7. Add scoring, queen, fouls, turn state, and winner flow.
8. Add online room synchronization and authoritative validation.
9. Add reconnect, disconnect, rematch, chat, and cleanup behavior.
10. Add visual polish and responsive layout.
11. Run all Carrom tests and the existing Ludo regression suite.
12. Perform a final audit for duplicate handlers, stale state, race conditions, and game-type leakage.

Do not implement a fake board with random coin movement. Do not mark Carrom complete until a full two-player match can be played from lobby to winner screen locally and through the realtime room flow.
