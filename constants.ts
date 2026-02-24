export const BOARD_SIZE = 8;
export const SQUARE_SIZE = 2;
export const BOARD_OFFSET = (BOARD_SIZE * SQUARE_SIZE) / 2 - SQUARE_SIZE / 2;

// Colors
export const WHITE_SQUARE_COLOR = "#e2e8f0"; // slate-200
export const BLACK_SQUARE_COLOR = "#475569"; // slate-600
export const HIGHLIGHT_COLOR = "#facc15"; // yellow-400
export const MOVE_HINT_COLOR = "#22c55e"; // green-500
export const AI_DEST_CHECK_COLOR = "#f97316"; // orange-500
export const CHECK_COLOR = "#ef4444"; // red-500

export const WHITE_PIECE_COLOR = "#f8fafc"; // slate-50
export const BLACK_PIECE_COLOR = "#1e293b"; // slate-800

// Piece Heights (approximate for layout)
export const PIECE_HEIGHTS: Record<string, number> = {
  p: 1,
  n: 1.5,
  b: 1.8,
  r: 1.6,
  q: 2.2,
  k: 2.5,
};
