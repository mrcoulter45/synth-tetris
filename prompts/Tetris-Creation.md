You are an expert frontend game developer specializing in HTML5 canvas games, JavaScript, and CSS animation. Your task is to build a fully functional, browser-based Tetris game with a synthwave / retro-futuristic visual style. The game should be implemented using plain HTML, CSS, and JavaScript (no external frameworks are required unless explicitly chosen for convenience, like a small utility library).

The game must include the standard Tetris mechanics plus a working “hold piece” system: the player can press Shift to swap the current active tetromino with a held one.

### Goal

Create a complete, self-contained Tetris game that:

* Runs in a modern browser using a single HTML file (or a small set of files: `index.html`, `styles.css`, and `script.js`).
* Implements classic Tetris gameplay (movement, rotation, gravity, line clearing, scoring, levels).
* Includes a “hold piece” mechanic triggered by Shift.
* Has a synthwave-inspired aesthetic in layout, colors, typography, and effects.

Provide production-ready, well-structured code with clear comments explaining key parts of the implementation.

---

### Instructions

#### 1. Technology and Structure

* Use **HTML**, **CSS**, and **JavaScript** only.
* Organize code as:

  * `index.html` – game layout and containers.
  * `styles.css` – synthwave UI styling.
  * `script.js` – game logic and rendering.
* Use the HTML `<canvas>` element (or div grid) for the Tetris board. Prefer `<canvas>` for smoother and more flexible rendering.

#### 2. Core Game Mechanics

Implement standard Tetris rules and behavior:

1. **Grid and Pieces**

   * Board size: 10 columns × 20 rows (optional hidden buffer rows at the top for spawning).
   * Include all seven classic tetrominoes (I, O, T, S, Z, J, L).
   * Each tetromino should be defined as a set of rotations (0°, 90°, 180°, 270°).
   * Pieces fall from the top and lock when they either reach the bottom or collide with stacked blocks.

2. **Controls**

   * Left Arrow / A: move piece left.
   * Right Arrow / D: move piece right.
   * Down Arrow / S: soft drop (piece descends faster).
   * Up Arrow / W or X: rotate piece clockwise.
   * Z (optional): rotate piece counterclockwise.
   * Space: hard drop (immediately drop piece to the lowest available position).
   * **Shift**: activate the hold mechanic (swap current piece with held piece, see exact behavior below).
   * Escape or P: pause/unpause.

3. **Gravity and Locking**

   * Implement a timer-based gravity system that automatically moves the current tetromino down at a fixed interval.
   * Speed should increase as the level increases.
   * When a piece can no longer move downward (collision), it should “lock” into the board after a short lock delay (configurable).

4. **Line Clearing and Scoring**

   * Detect and clear completed horizontal lines.
   * After clearing, shift all rows above downward.
   * Implement a basic scoring system:

     * Award points based on number of lines cleared at once (e.g., single, double, triple, Tetris).
     * Optionally include soft drop and hard drop bonuses.
   * Track:

     * Current score
     * Lines cleared
     * Level (increase level every N lines).

5. **Game Over**

   * Game over occurs when new tetrominoes overlap with existing blocks at spawn time.
   * Display a clear game over overlay with final score and an option to restart.

---

#### 3. “Hold Piece” Mechanic (Shift Key)

Implement a **fully functional hold system** with the following behavior:

1. **Hold Slot Basics**

   * Provide a visible **hold box** in the UI showing the currently held tetromino (if any).
   * The **Shift key** triggers hold.

2. **Behavior**

   * If **no piece is currently held**:

     * Pressing Shift moves the current active tetromino into the hold slot.
     * The current piece is immediately replaced with the **next** piece from the queue.
   * If **there is already a held piece**:

     * Pressing Shift swaps the **current active tetromino** with the **held tetromino**.
   * After a hold or swap, the new active piece should spawn at the top in its initial rotation/state.

3. **Hold Usage Limit**

   * Holding should only be allowed **once per spawned piece**:

     * Once the player holds/swaps with Shift for the current tetromino, they cannot hold again until that tetromino has locked into the board and the next tetromino has spawned.
   * Implement a boolean flag like `hasHeldThisTurn` to enforce this.

4. **Edge Cases**

   * Ensure hold does not cause out-of-bounds placement or instant collisions; handle spawn position properly.
   * Reset the piece’s rotation and position when it is taken out of the hold slot and spawned.
   * Holding should not clear lines or affect board state directly; it only changes which piece is active and which is in the hold slot.

---

#### 4. Next Piece Queue

* Implement a **next piece queue** (at least 3 visible upcoming pieces).
* Show the queue visually in the UI as mini representations of upcoming tetrominoes.
* Use a “bag” or standard randomized sequence of tetrominoes to avoid streaky randomness if desired.

---

#### 5. Synthwave Visual Style

Give the game a strong synthwave / retro-futuristic aesthetic:

1. **Color Palette**

   * Dark, starry, or grid-like background (e.g., deep purple, dark blue, black gradient).
   * Neon accent colors for tetrominoes (e.g., cyan, magenta, hot pink, electric blue, neon yellow, lime).
   * Glowing outlines or subtle borders around blocks.

2. **Typography and UI**

   * Use a futuristic or retro digital font (e.g., something reminiscent of 80s arcade titles; use a Google Font if desired).
   * Neon-esque text, with glowing text-shadows.
   * Stylized headers like “TETRIS” or “SYNTHRIS.”

3. **Effects and Atmosphere**

   * Gradients, glows, and subtle animations (e.g., pulsing glow, moving background grid).
   * Optional: animated synthwave horizon or grid in the background using CSS or canvas.
   * Smooth transitions for UI panels and overlays (pause, game over, etc.).

4. **Layout**

   * Center the game board.
   * Place HUD elements (score, level, lines, next queue, hold box) around the board in a visually balanced way.
   * Ensure layout is responsive enough to look good on typical desktop resolutions.

---

#### 6. UI Elements and HUD

Include the following visible UI components:

* Main Tetris board.
* Score display.
* Level display.
* Lines cleared.
* Next piece queue area.
* Hold piece area (clearly labeled “HOLD”).
* Pause indicator or overlay.
* Game over overlay with:

  * Final score
  * Lines/level
  * “Press [key] or click to restart” instruction.

---

#### 7. Code Quality and Structure

* Use clear, modular JavaScript:

  * Separate logic into functions and/or small classes or objects (e.g., `Board`, `Piece`, `Game`).
  * Maintain a clear game loop for updating state and rendering.
* Add concise, helpful comments explaining:

  * Tetromino data structures and rotations.
  * Collision detection.
  * Line-clearing logic.
  * Hold mechanic implementation.
  * Input handling and game loop.
* Avoid unnecessary global variables; prefer scoped variables and clear state management.
* Ensure the game runs at a stable frame rate and that rendering is efficient.

---

#### 8. Output Requirements

Provide the final answer as:

1. **`index.html`**

   * Includes:

     * `<canvas>` for the game board.
     * Containers for score, lines, level, next queue, and hold piece.
     * Links to `styles.css` and `script.js`.
   * Minimal but correct HTML structure.

2. **`styles.css`**

   * Full synthwave styling of:

     * Body/background.
     * Game container, board frame, side panels.
     * Next and hold boxes.
     * Text and headings, including neon glow effects.
   * Make sure everything looks visually cohesive.

3. **`script.js`**

   * Complete game logic, wired to canvas and DOM elements.
   * Key handlers for all controls, including Shift for hold.
   * Rendering code for:

     * Board
     * Active piece
     * Locked blocks
     * Next queue preview
     * Hold piece preview
   * Game loop using `requestAnimationFrame` or a timer, with clear separation between update and render logic.

Make sure the code runs without modification when the three files are placed in the same folder and opened in a modern browser.

---

### Example Behaviors (Clarification)

* When the game starts:

  * A random tetromino appears at the top.
  * Score, level, and lines displays are initialized to 0.
  * Hold box is empty.

* If the player presses Shift with no held piece:

  * Current piece moves into hold.
  * Next piece becomes the active piece.
  * `hasHeldThisTurn` is set so Shift cannot be used again until the piece locks.

* If later the player presses Shift when a piece is held:

  * Active piece and held piece swap.
  * The newly active piece spawns at the top in its initial orientation.
