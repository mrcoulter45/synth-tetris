// --- Synthris: Neon Tetris ---
// Plain JS Tetris implementation with hold mechanic and synthwave rendering.

/*
  High-level structure:

  - Constants define board size, timing, scoring, and tetromino shapes.
  - Game state:
      board[][], currentPiece, nextQueue, holdPieceType, hasHeldThisTurn, score, level, lines, etc.
  - Main systems:
      - Piece spawning & bag randomizer
      - Movement, rotation, gravity, lock delay, collision detection
      - Line clearing and scoring
      - Hold mechanic (Shift)
      - Next piece queue & hold rendering on small canvases
      - Game loop (update + render) using requestAnimationFrame
*/

(() => {
  // --- DOM references ---
  const canvas = document.getElementById("tetris");
  const ctx = canvas.getContext("2d");

  const holdCanvas = document.getElementById("hold-canvas");
  const holdCtx = holdCanvas.getContext("2d");

  const nextCanvas = document.getElementById("next-canvas");
  const nextCtx = nextCanvas.getContext("2d");

  const scoreEl = document.getElementById("score");
  const levelEl = document.getElementById("level");
  const linesEl = document.getElementById("lines");

  const pauseOverlay = document.getElementById("pause-overlay");
  const gameOverOverlay = document.getElementById("gameover-overlay");
  const finalScoreEl = document.getElementById("final-score");
  const finalLevelEl = document.getElementById("final-level");
  const finalLinesEl = document.getElementById("final-lines");
  const gameOverOverlayInner = gameOverOverlay?.querySelector(".overlay-inner");
  const scoreboardListEl = document.getElementById("scoreboard-list");
  const playerNameInput = document.getElementById("player-name");
  const saveScoreBtn = document.getElementById("save-score-btn");
  const scoreboardHintEl = document.getElementById("scoreboard-hint");
  const restartBtn = document.getElementById("restart-btn");

  // --- Constants ---
  const COLS = 10;
  const ROWS = 20;
  const CELL_SIZE = canvas.width / COLS; // 30px if 300px wide

  const LOCK_DELAY = 450; // ms
  const BASE_GRAVITY = 1000; // ms at level 1
  const DAS_DELAY = 130; // initial delay before auto-shift repeats
  const ARR_INTERVAL = 50; // auto-repeat rate for horizontal movement

  // Score table: single, double, triple, Tetris
  const LINE_SCORE = [0, 100, 300, 500, 800];

  const TETROMINO_TYPES = ["I", "O", "T", "S", "Z", "J", "L"];

  // Tetromino shapes as 4x4 matrices for each rotation.
  // 1 = filled, 0 = empty.
  const SHAPES = {
    I: [
      [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
      ],
      [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
      ],
    ],
    O: [
      [
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      // O piece rotations are identical
      [
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    ],
    T: [
      [
        [0, 1, 0, 0],
        [1, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [1, 1, 1, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0],
        [1, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
      ],
    ],
    S: [
      [
        [0, 1, 1, 0],
        [1, 1, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [1, 1, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [1, 0, 0, 0],
        [1, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
      ],
    ],
    Z: [
      [
        [1, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 1, 0],
        [0, 1, 1, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [1, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0],
        [1, 1, 0, 0],
        [1, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    ],
    J: [
      [
        [1, 0, 0, 0],
        [1, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 1, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [1, 1, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [1, 1, 0, 0],
        [0, 0, 0, 0],
      ],
    ],
    L: [
      [
        [0, 0, 1, 0],
        [1, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [1, 1, 1, 0],
        [1, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [1, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
      ],
    ],
  };

  // Neon colors per tetromino type
  const COLORS = {
    I: "#00f5ff",
    O: "#ffe96b",
    T: "#ff52ff",
    S: "#56ff9f",
    Z: "#ff5f7b",
    J: "#8ae2ff",
    L: "#ff9f46",
  };

  const SCORE_STORAGE_KEY = "synthris-highscores";
  const NAME_STORAGE_KEY = "synthris-player-name";
  const MAX_SCORES = 8;

  // --- Game state ---
  let board;
  let currentPiece = null;
  let nextQueue = [];
  let holdPieceType = null;
  let hasHeldThisTurn = false;

  let score = 0;
  let level = 1;
  let linesCleared = 0;

  let lastTime = 0;
  let dropAccumulator = 0;
  let dropInterval = BASE_GRAVITY;
  let isPaused = false;
  let isGameOver = false;

  let lockTimer = 0;
  let isLocking = false;

  let highScores = [];
  let hasSavedCurrentScore = false;
  let lastUsedName = "";

  // --- Input state ---
  const inputState = { left: false, right: false };
  let lastHorizontalInput = 0; // -1 = left, 1 = right
  let horizontalDir = 0;
  let dasTimer = 0;
  let arrTimer = 0;

  // --- Utility functions ---

  function createMatrix(rows, cols, fill = null) {
    const m = [];
    for (let r = 0; r < rows; r++) {
      const row = new Array(cols).fill(fill);
      m.push(row);
    }
    return m;
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function getShape(piece) {
    return SHAPES[piece.type][piece.rotation];
  }

  // --- Bag randomizer ---

  function refillBag() {
    const bag = shuffle(TETROMINO_TYPES.slice());
    nextQueue.push(...bag);
  }

  function nextTypeFromQueue() {
    if (nextQueue.length < 7) {
      refillBag();
    }
    return nextQueue.shift();
  }

  // --- Piece creation & spawning ---

  function createPiece(type) {
    return {
      type,
      rotation: 0,
      x: 3, // spawn column
      y: -2, // slightly above visible board
    };
  }

  function spawnNextPiece() {
    const type = nextTypeFromQueue();
    currentPiece = createPiece(type);
    hasHeldThisTurn = false;
    dropAccumulator = 0;
    lockTimer = 0;
    isLocking = false;

    if (collides(currentPiece, 0, 0)) {
      triggerGameOver();
    }

    updateHUD();
    renderHold();
    renderNext();
  }

  // --- Collision detection ---
  // Returns true if the piece at its current position plus offset hits wall/ground/other blocks.
  function collides(piece, offsetX, offsetY, rotationOverride = null) {
    const shape =
      rotationOverride === null
        ? getShape(piece)
        : SHAPES[piece.type][rotationOverride];

    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        if (!shape[y][x]) continue;

        const newX = piece.x + x + offsetX;
        const newY = piece.y + y + offsetY;

        // Off left/right/bottom => collision
        if (newX < 0 || newX >= COLS || newY >= ROWS) {
          return true;
        }

        // Off top is okay, we treat hidden spawn rows as free
        if (newY < 0) {
          continue;
        }

        if (board[newY][newX]) {
          return true;
        }
      }
    }
    return false;
  }

  // --- Movement & rotation ---

  function movePiece(dx, dy, isSoftDrop = false) {
    if (!currentPiece || isGameOver || isPaused) return;

    const oldX = currentPiece.x;
    const oldY = currentPiece.y;

    currentPiece.x += dx;
    currentPiece.y += dy;

    if (collides(currentPiece, 0, 0)) {
      // Revert if collision
      currentPiece.x = oldX;
      currentPiece.y = oldY;

      if (dy > 0) {
        // Attempted to move down but can't => start or continue lock timer
        if (!isLocking) {
          isLocking = true;
          lockTimer = 0;
        }
      }
      return;
    }

    // Successful downward movement
    if (dy > 0) {
      if (isSoftDrop) {
        score += 1; // soft drop bonus
      }
      isLocking = false;
      lockTimer = 0;
    }
  }

  // Simple rotation with collision check (no advanced wall kicks)
  function rotatePiece(dir) {
    if (!currentPiece || isGameOver || isPaused) return;

    const oldRotation = currentPiece.rotation;
    const newRotation = (oldRotation + dir + 4) % 4;

    if (!collides(currentPiece, 0, 0, newRotation)) {
      currentPiece.rotation = newRotation;
    } else {
      // small horizontal kick try (basic)
      currentPiece.x += 1;
      if (!collides(currentPiece, 0, 0, newRotation)) {
        currentPiece.rotation = newRotation;
        return;
      }
      currentPiece.x -= 2;
      if (!collides(currentPiece, 0, 0, newRotation)) {
        currentPiece.rotation = newRotation;
        return;
      }
      // revert position & rotation
      currentPiece.x += 1;
    }
  }

  // Hard drop: slide down until collision, then lock
  function hardDrop() {
    if (!currentPiece || isGameOver || isPaused) return;

    let dropCount = 0;
    while (!collides(currentPiece, 0, 1)) {
      currentPiece.y += 1;
      dropCount++;
    }
    if (dropCount > 0) {
      score += dropCount * 2; // hard drop bonus
    }
    lockPiece();
  }

  // --- Locking & line clear ---

  function lockPiece() {
    if (!currentPiece) return;

    const shape = getShape(currentPiece);
    let placedAboveVisible = false;

    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        if (!shape[y][x]) continue;
        const boardX = currentPiece.x + x;
        const boardY = currentPiece.y + y;

        if (boardY < 0) {
          placedAboveVisible = true;
          continue;
        }

        if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
          board[boardY][boardX] = currentPiece.type;
        }
      }
    }

    currentPiece = null;
    isLocking = false;
    lockTimer = 0;

    if (placedAboveVisible) {
      triggerGameOver();
      return;
    }

    const cleared = clearLines();
    updateScoreAndLevel(cleared);

    spawnNextPiece();
  }

  // Remove full lines and shift rows down
  function clearLines() {
    let cleared = 0;

    for (let y = ROWS - 1; y >= 0; ) {
      const isFull = board[y].every((cell) => cell !== null);
      if (isFull) {
        board.splice(y, 1);
        board.unshift(new Array(COLS).fill(null));
        cleared++;
      } else {
        y--;
      }
    }
    linesCleared += cleared;
    return cleared;
  }

  function updateScoreAndLevel(clearedLines) {
    if (clearedLines > 0) {
      score += LINE_SCORE[clearedLines] * level;
    }

    // Level up every 10 lines
    const newLevel = Math.floor(linesCleared / 10) + 1;
    if (newLevel !== level) {
      level = newLevel;
      updateDropInterval();
    }

    updateHUD();
  }

  function updateDropInterval() {
    // speed up each level, but clamp to a minimum
    // roughly geometric progression
    dropInterval = Math.max(80, BASE_GRAVITY * Math.pow(0.86, level - 1));
  }

  // --- Scoreboard & persistence ---

  function loadStoredName() {
    try {
      const stored = localStorage.getItem(NAME_STORAGE_KEY);
      if (stored) {
        lastUsedName = stored;
      }
    } catch (err) {
      lastUsedName = "";
    }
  }

  function persistName(name) {
    try {
      localStorage.setItem(NAME_STORAGE_KEY, name);
    } catch (err) {
      // ignore storage errors
    }
  }

  function sortHighScores() {
    highScores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.level !== a.level) return b.level - a.level;
      return b.lines - a.lines;
    });
  }

  function loadHighScores() {
    highScores = [];
    try {
      const raw = localStorage.getItem(SCORE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          highScores = parsed
            .map((entry) => ({
              name: (entry.name || "ANON").toString().slice(0, 12).toUpperCase(),
              score: Number(entry.score) || 0,
              level: Number(entry.level) || 1,
              lines: Number(entry.lines) || 0,
            }))
            .slice(0, MAX_SCORES);
        }
      }
    } catch (err) {
      highScores = [];
    }
    sortHighScores();
  }

  function persistHighScores() {
    try {
      localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(highScores));
    } catch (err) {
      // ignore storage errors
    }
  }

  function qualifiesForHall(currentScore) {
    if (!highScores.length) return true;
    if (highScores.length < MAX_SCORES) return true;
    const lowest = highScores[highScores.length - 1];
    return currentScore >= lowest.score;
  }

  function renderScoreboard() {
    if (!scoreboardListEl) return;

    scoreboardListEl.innerHTML = "";

    if (!highScores.length) {
      const empty = document.createElement("li");
      empty.className = "empty-state";
      empty.textContent = "No recorded runs yet.";
      scoreboardListEl.appendChild(empty);
      return;
    }

    highScores.forEach((entry) => {
      const li = document.createElement("li");
      const scoreValue = typeof entry.score === "number" ? entry.score : Number(entry.score) || 0;
      const levelValue = entry.level ?? 1;
      const lineValue = entry.lines ?? 0;

      const nameEl = document.createElement("div");
      nameEl.className = "score-name";
      nameEl.textContent = entry.name;

      const metaEl = document.createElement("div");
      metaEl.className = "score-meta";
      metaEl.textContent = `Lv ${levelValue} • ${lineValue} lines`;

      const valueEl = document.createElement("div");
      valueEl.className = "score-value";
      valueEl.textContent = scoreValue.toLocaleString();

      li.appendChild(nameEl);
      li.appendChild(metaEl);
      li.appendChild(valueEl);
      scoreboardListEl.appendChild(li);
    });
  }

  function resetScoreSaveUI() {
    hasSavedCurrentScore = false;
    if (saveScoreBtn) {
      saveScoreBtn.disabled = false;
      saveScoreBtn.textContent = "Record Run";
    }
    if (scoreboardHintEl) {
      scoreboardHintEl.textContent = "Scores are saved locally";
    }
    if (playerNameInput) {
      playerNameInput.value = lastUsedName;
    }
  }

  function handleScoreSubmit() {
    if (!isGameOver || hasSavedCurrentScore) return;

    const rawName = playerNameInput ? playerNameInput.value.trim() : "";
    const normalizedName = (rawName || lastUsedName || "NEON PILOT").slice(0, 12).toUpperCase();

    lastUsedName = normalizedName;
    persistName(normalizedName);

    highScores.push({
      name: normalizedName,
      score,
      level,
      lines: linesCleared,
    });

    sortHighScores();
    highScores = highScores.slice(0, MAX_SCORES);
    persistHighScores();
    renderScoreboard();

    hasSavedCurrentScore = true;
    if (saveScoreBtn) {
      saveScoreBtn.disabled = true;
      saveScoreBtn.textContent = "Saved";
    }
    if (scoreboardHintEl) {
      scoreboardHintEl.textContent = "Saved to your neon hall.";
    }
  }

  // --- Hold mechanic (Shift) ---

  /*
    Behavior:
    - If no piece in hold: move current to hold, pull a new piece from queue.
    - If piece in hold: swap current type with hold type.
    - Can only use once per spawned piece (hasHeldThisTurn flag).
  */
  function holdCurrentPiece() {
    if (!currentPiece || isGameOver || isPaused) return;
    if (hasHeldThisTurn) return; // only once per spawned piece

    const currentType = currentPiece.type;

    if (holdPieceType === null) {
      // First time hold: stash current and fetch next
      holdPieceType = currentType;
      currentPiece = null;
      spawnNextPiece();
    } else {
      // Swap
      const tempType = holdPieceType;
      holdPieceType = currentType;
      currentPiece = createPiece(tempType);

      if (collides(currentPiece, 0, 0)) {
        triggerGameOver();
        return;
      }
    }

    hasHeldThisTurn = true;
    renderHold();
  }

  // --- HUD and overlays ---

  function updateHUD() {
    scoreEl.textContent = score;
    levelEl.textContent = level;
    linesEl.textContent = linesCleared;
  }

  function showPauseOverlay(show) {
    pauseOverlay.classList.toggle("hidden", !show);
  }

  // Snapshot-ready showcase state
  function enterShowcasePose() {
    if (isGameOver) return;

    // Lock gameplay
    isPaused = true;
    isLocking = false;
    lockTimer = 0;
    dropAccumulator = 0;
    showPauseOverlay(false); // hide overlay to keep board visible

    // Set polished HUD values
    score = 12500;
    level = 7;
    linesCleared = 18;
    updateDropInterval();
    updateHUD();

    // Curated stack layout (roughly one-third full)
    const layout = [
      "..........",
      "..........",
      "..........",
      "..........",
      "..........",
      "..........",
      "..........",
      "..........",
      "..........",
      "..........",
      "..........",
      "..........",
      "..........",
      ".........I",
      "T........I",
      "TTS...ZIII",
      "TZSS.ZZIII",
      "ZZSS.ZLLOO",
      "ZTSS.ILLOO",
      "TTTS.ILLOO",
    ];

    board = createMatrix(ROWS, COLS, null);
    for (let r = 0; r < ROWS; r++) {
      const row = layout[r] || "..........";
      for (let c = 0; c < COLS; c++) {
        const cell = row[c];
        board[r][c] = cell === "." ? null : cell;
      }
    }

    // Active piece staged about one-third down, ready to slot in
    currentPiece = createPiece("I");
    currentPiece.rotation = 1;
    currentPiece.x = 2;
    currentPiece.y = 4;

    // Curate hold/next for visual balance
    holdPieceType = "Z";
    hasHeldThisTurn = false;
    nextQueue = ["J", "S", "O", "T"];

    renderHold();
    renderNext();
  }

  function triggerGameOver() {
    isGameOver = true;
    isPaused = false;
    currentPiece = null;
    showPauseOverlay(false);

    finalScoreEl.textContent = score;
    finalLevelEl.textContent = level;
    finalLinesEl.textContent = linesCleared;
    resetScoreSaveUI();
    renderScoreboard();

    if (scoreboardHintEl) {
      scoreboardHintEl.textContent = qualifiesForHall(score)
        ? "Record this run to enter the hall."
        : "Only top runs stay—log yours to challenge the board.";
    }

    gameOverOverlay.classList.remove("hidden");
  }

  function hideGameOverOverlay() {
    gameOverOverlay.classList.add("hidden");
  }

  function restartGame() {
    board = createMatrix(ROWS, COLS, null);
    nextQueue = [];
    holdPieceType = null;
    hasHeldThisTurn = false;
    currentPiece = null;

    score = 0;
    level = 1;
    linesCleared = 0;
    isPaused = false;
    isGameOver = false;
    hasSavedCurrentScore = false;
    lastTime = 0;
    dropAccumulator = 0;
    updateDropInterval();
    updateHUD();
    hideGameOverOverlay();
    resetScoreSaveUI();

    refillBag();
    spawnNextPiece();
  }

  // --- Rendering ---

  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawBoard() {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = board[y][x];
        if (!cell) continue;
        drawCell(ctx, x, y, COLORS[cell]);
      }
    }
  }

  // Draw current active piece
  function drawCurrentPiece() {
    if (!currentPiece) return;
    const shape = getShape(currentPiece);

    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        if (!shape[y][x]) continue;
        const drawX = currentPiece.x + x;
        const drawY = currentPiece.y + y;
        if (drawY < 0) continue; // skip hidden rows
        drawCell(ctx, drawX, drawY, COLORS[currentPiece.type]);
      }
    }
  }

  // Draw ghost piece (landing position)
  function drawGhostPiece() {
    if (!currentPiece) return;

    const ghost = {
      type: currentPiece.type,
      rotation: currentPiece.rotation,
      x: currentPiece.x,
      y: currentPiece.y,
    };

    while (!collides(ghost, 0, 1)) {
      ghost.y += 1;
    }

    const shape = getShape(ghost);
    ctx.save();
    ctx.globalAlpha = 0.25;

    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        if (!shape[y][x]) continue;
        const drawX = ghost.x + x;
        const drawY = ghost.y + y;
        if (drawY < 0) continue;
        drawCell(ctx, drawX, drawY, COLORS[ghost.type], true);
      }
    }

    ctx.restore();
  }

  // Draw a single cell with neon style
  function drawCell(context, col, row, color, isGhost = false) {
    const x = col * CELL_SIZE;
    const y = row * CELL_SIZE;

    context.save();

    const padding = 1;
    const w = CELL_SIZE - padding * 2;
    const h = CELL_SIZE - padding * 2;

    // Outer glow
    if (!isGhost) {
      context.shadowBlur = 18;
      context.shadowColor = color;
    }
    context.fillStyle = isGhost ? "rgba(255,255,255,0.12)" : color;
    context.fillRect(x + padding, y + padding, w, h);

    // Inner gradient
    const grad = context.createLinearGradient(
      x + padding,
      y + padding,
      x + CELL_SIZE,
      y + CELL_SIZE
    );
    grad.addColorStop(0, "rgba(255,255,255,0.35)");
    grad.addColorStop(0.4, "rgba(255,255,255,0.05)");
    grad.addColorStop(1, "rgba(0,0,0,0.35)");
    context.fillStyle = grad;
    context.fillRect(x + padding, y + padding, w, h);

    // Border
    context.lineWidth = 1;
    context.strokeStyle = isGhost ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.65)";
    context.strokeRect(x + padding, y + padding, w, h);

    context.restore();
  }

  // --- Hold / Next rendering (preview canvases) ---

  function clearPreview(ctxPreview, canvasPreview) {
    ctxPreview.clearRect(0, 0, canvasPreview.width, canvasPreview.height);
  }

  function resizeNextCanvas() {
    const rect = nextCanvas.getBoundingClientRect();
    if (rect.width && rect.height) {
      nextCanvas.width = Math.floor(rect.width);
      nextCanvas.height = Math.floor(rect.height);
    }
  }

  // Render the hold piece (single tetromino preview)
  function renderHold() {
    clearPreview(holdCtx, holdCanvas);

    if (!holdPieceType) return;

    drawPreviewTetromino(holdCtx, holdCanvas, holdPieceType, 0, 0, 1);
  }

  // Render next 4 pieces in the queue
  function renderNext() {
    clearPreview(nextCtx, nextCanvas);

    const count = Math.min(4, nextQueue.length);
    for (let i = 0; i < count; i++) {
      const type = nextQueue[i];
      // stack previews vertically
      drawPreviewTetromino(nextCtx, nextCanvas, type, 0, i, count);
    }
  }

  /*
    Draw a tetromino preview on a small canvas.

    index = vertical index (0..n-1) in the next-canvas for stacking.
    total = number of previews to show in next-canvas.

    For hold canvas:
      index = 0, total = 1.
  */
  function drawPreviewTetromino(ctxPreview, canvasPreview, type, index, iStack, totalStack) {
    const size = 4;
    const matrix = SHAPES[type][0]; // use rotation 0 for preview

    const slotHeight = canvasPreview.height / totalStack;
    const maxCellByHeight = slotHeight / size;
    const maxCellByWidth = canvasPreview.width / size;
    const cellSize = Math.min(maxCellByHeight, maxCellByWidth) * 0.65;

    // Determine bounding box of the shape to center it
    let minX = size, maxX = -1, minY = size, maxY = -1;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (!matrix[y][x]) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    const shapeWidth = (maxX - minX + 1) * cellSize;
    const shapeHeight = (maxY - minY + 1) * cellSize;

    const offsetX = (canvasPreview.width - shapeWidth) / 2 - minX * cellSize;

    const baseY = iStack * slotHeight;
    const offsetY = baseY + (slotHeight - shapeHeight) / 2 - minY * cellSize;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (!matrix[y][x]) continue;
        const drawX = offsetX + x * cellSize;
        const drawY = offsetY + y * cellSize;

        ctxPreview.save();

        // Outer glow
        ctxPreview.shadowBlur = 10;
        ctxPreview.shadowColor = COLORS[type];
        ctxPreview.fillStyle = COLORS[type];

        const pad = 1;
        const w = cellSize - pad * 2;
        const h = cellSize - pad * 2;
        ctxPreview.fillRect(drawX + pad, drawY + pad, w, h);

        const grad = ctxPreview.createLinearGradient(
          drawX + pad,
          drawY + pad,
          drawX + cellSize,
          drawY + cellSize
        );
        grad.addColorStop(0, "rgba(255,255,255,0.4)");
        grad.addColorStop(0.5, "rgba(255,255,255,0.08)");
        grad.addColorStop(1, "rgba(0,0,0,0.5)");
        ctxPreview.fillStyle = grad;
        ctxPreview.fillRect(drawX + pad, drawY + pad, w, h);

        ctxPreview.lineWidth = 0.8;
        ctxPreview.strokeStyle = "rgba(0,0,0,0.7)";
        ctxPreview.strokeRect(drawX + pad, drawY + pad, w, h);

        ctxPreview.restore();
      }
    }
  }

  // --- Game loop ---

  function update(delta) {
    if (isPaused || isGameOver) return;

    updateHorizontalMovement(delta);

    // Gravity
    dropAccumulator += delta;
    if (dropAccumulator >= dropInterval) {
      dropAccumulator -= dropInterval;
      movePiece(0, 1, false);
    }

    // Lock delay
    if (isLocking && currentPiece) {
      lockTimer += delta;
      if (lockTimer >= LOCK_DELAY) {
        lockPiece();
      }
    }
  }

  function render() {
    clearCanvas();
    drawBoard();
    drawGhostPiece();
    drawCurrentPiece();
  }

  function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    update(delta);
    render();

    requestAnimationFrame(gameLoop);
  }

  // --- Input handling ---

  function updateHorizontalDirection(shouldNudge) {
    let newDir = 0;
    if (inputState.left && !inputState.right) newDir = -1;
    else if (inputState.right && !inputState.left) newDir = 1;
    else if (inputState.left && inputState.right) newDir = lastHorizontalInput;

    if (newDir !== horizontalDir) {
      horizontalDir = newDir;
      dasTimer = 0;
      arrTimer = 0;
      if (horizontalDir && shouldNudge) {
        movePiece(horizontalDir, 0, false);
      }
    }
  }

  function updateHorizontalMovement(delta) {
    if (!horizontalDir || !currentPiece) return;

    // Wait for DAS, then repeat moves every ARR tick
    if (dasTimer < DAS_DELAY) {
      dasTimer += delta;
      return;
    }

    arrTimer += delta;
    while (arrTimer >= ARR_INTERVAL) {
      movePiece(horizontalDir, 0, false);
      arrTimer -= ARR_INTERVAL;
    }
  }

  function handleKeyDown(e) {
    const key = e.key;
    const isTypingName = document.activeElement === playerNameInput;

    if (isTypingName) {
      if (key === "Enter") {
        e.preventDefault();
        handleScoreSubmit();
      }
      return;
    }

    if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " ", "z", "Z", "x", "X", "w", "W", "a", "A", "s", "S", "d", "D"].includes(key)) {
      e.preventDefault();
    }

    if (isGameOver) {
      // Allow restart from game over
      if (key === "r" || key === "R") {
        restartGame();
      }
      return;
    }

    switch (key) {
      case "ArrowLeft":
      case "a":
      case "A":
        if (!inputState.left) {
          inputState.left = true;
          lastHorizontalInput = -1;
          updateHorizontalDirection(true);
        }
        break;
      case "ArrowRight":
      case "d":
      case "D":
        if (!inputState.right) {
          inputState.right = true;
          lastHorizontalInput = 1;
          updateHorizontalDirection(true);
        }
        break;
      case "ArrowDown":
      case "s":
      case "S":
        movePiece(0, 1, true);
        break;
      case "ArrowUp":
      case "w":
      case "W":
      case "x":
      case "X":
        rotatePiece(1);
        break;
      case "z":
      case "Z":
        rotatePiece(-1);
        break;
      case " ":
        hardDrop();
        break;
      case "Shift":
        if (!e.repeat) {
          holdCurrentPiece();
        }
        break;
      case "1":
        enterShowcasePose();
        break;
      case "p":
      case "P":
      case "Escape":
        togglePause();
        break;
      case "r":
      case "R":
        // Allow restart mid-game as well
        restartGame();
        break;
    }
  }

  function handleKeyUp(e) {
    const key = e.key;
    switch (key) {
      case "ArrowLeft":
      case "a":
      case "A":
        inputState.left = false;
        updateHorizontalDirection(true);
        break;
      case "ArrowRight":
      case "d":
      case "D":
        inputState.right = false;
        updateHorizontalDirection(true);
        break;
    }
  }

  function togglePause() {
    if (isGameOver) return;
    isPaused = !isPaused;
    showPauseOverlay(isPaused);
  }

  // Clicking outside the card restarts; keep the card interactive
  if (gameOverOverlayInner) {
    gameOverOverlayInner.addEventListener("click", (e) => e.stopPropagation());
  }

  gameOverOverlay.addEventListener("click", (e) => {
    if (isGameOver && e.target === gameOverOverlay) {
      restartGame();
    }
  });

  if (saveScoreBtn) {
    saveScoreBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleScoreSubmit();
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener("click", (e) => {
      e.preventDefault();
      restartGame();
    });
  }

  if (playerNameInput) {
    playerNameInput.addEventListener("input", () => {
      if (isGameOver) {
        hasSavedCurrentScore = false;
        if (saveScoreBtn) {
          saveScoreBtn.disabled = false;
          saveScoreBtn.textContent = "Record Run";
        }
        if (scoreboardHintEl) {
          scoreboardHintEl.textContent = "Record this run to enter the hall.";
        }
      }
    });
  }

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
  window.addEventListener("resize", () => {
    resizeNextCanvas();
    renderNext();
  });

  // --- Initialize game ---
  function init() {
    loadStoredName();
    loadHighScores();
    resetScoreSaveUI();
    renderScoreboard();
    board = createMatrix(ROWS, COLS, null);
    updateDropInterval();
    refillBag();
    resizeNextCanvas();
    spawnNextPiece();
    updateHUD();
    requestAnimationFrame(gameLoop);
  }

  init();
})();
