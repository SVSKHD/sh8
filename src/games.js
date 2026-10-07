/* pure game logic for the Games tab — no Vue, easy to test */

/* ---------- rock paper scissors ---------- */
export const RPS = ["rock", "paper", "scissors"];
const BEATS = { rock: "scissors", paper: "rock", scissors: "paper" };

/* "win" | "lose" | "draw" from the player's point of view */
export function rpsResult(player, opponent) {
  if (player === opponent) return "draw";
  return BEATS[player] === opponent ? "win" : "lose";
}

export const rpsRandom = (rand = Math.random) => RPS[Math.floor(rand() * 3) % 3];

/* ---------- tic tac toe ---------- */
/* board: array of 9 cells, each "X" | "O" | null */
export const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

/* { winner: "X" | "O", line: [a, b, c] } | { winner: "draw" } | null (still playing) */
export function tttStatus(board) {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return { winner: board[a], line };
  }
  return board.every(Boolean) ? { winner: "draw" } : null;
}

const other = (p) => (p === "X" ? "O" : "X");

function minimax(board, turn, me, depth) {
  const s = tttStatus(board);
  if (s) return s.winner === me ? 10 - depth : s.winner === "draw" ? 0 : depth - 10;
  let best = turn === me ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    board[i] = turn;
    const score = minimax(board, other(turn), me, depth + 1);
    board[i] = null;
    best = turn === me ? Math.max(best, score) : Math.min(best, score);
  }
  return best;
}

/* computer move for `me`. `mistakeRate` (0–1) is the chance of a random
   move instead of the perfect one, so it stays beatable and fun. */
export function tttBestMove(board, me, { mistakeRate = 0, rand = Math.random } = {}) {
  const empty = board.map((v, i) => (v ? -1 : i)).filter((i) => i > -1);
  if (!empty.length) return -1;
  if (rand() < mistakeRate) return empty[Math.floor(rand() * empty.length) % empty.length];
  let best = -Infinity;
  let moves = [];
  for (const i of empty) {
    const b = board.slice();
    b[i] = me;
    const score = minimax(b, other(me), me, 1);
    if (score > best) {
      best = score;
      moves = [i];
    } else if (score === best) moves.push(i);
  }
  // several equally-good moves: pick one so games don't all look the same
  return moves[Math.floor(rand() * moves.length) % moves.length];
}
