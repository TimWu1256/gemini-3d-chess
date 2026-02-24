import React, { useRef, useState, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, ContactShadows } from '@react-three/drei';
import { Chess, Square, Move } from 'chess.js';
import { BOARD_SIZE, SQUARE_SIZE, BOARD_OFFSET, WHITE_SQUARE_COLOR, BLACK_SQUARE_COLOR, HIGHLIGHT_COLOR, MOVE_HINT_COLOR, CHECK_COLOR } from '../constants';
import { Piece } from './Pieces';
import { BoardSquare, GameMode } from '../types';

interface ChessBoard3DProps {
  game: Chess;
  onMove: (from: string, to: string) => void;
  validMoves: string[];
  playerColor?: 'w' | 'b';
  mode?: GameMode;
  aiHint?: { from: string, to: string } | null;
}

const getPosition = (fileIndex: number, rankIndex: number): [number, number, number] => {
  const x = fileIndex * SQUARE_SIZE - BOARD_OFFSET;
  const z = (7 - rankIndex) * SQUARE_SIZE - BOARD_OFFSET; // Revert z to match chess rank ordering
  return [x, 0, z];
};

export const ChessBoard3D: React.FC<ChessBoard3DProps> = ({ game, onMove, validMoves, playerColor = 'w', mode = 'AI', aiHint }) => {
  const { camera } = useThree();
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const controlsRef = useRef<any>(null);

  React.useEffect(() => {
    // Determine target Z position based on requirements:
    // 1. AI & Local: Always White perspective (behind White pieces at z=-15)
    // 2. Online: Default White, switch to assigned color on connect

    let targetZ = -15; // Default: White perspective (-15 is behind rank 1/White)

    if (mode === 'ONLINE' && playerColor === 'b') {
        targetZ = 15; // Connected as Black -> Black perspective (+15 is behind rank 8/Black)
    }

    camera.position.set(0, 10, targetZ);
    camera.lookAt(0, 0, 0);

    // Update controls if they exist to sync with new camera position
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  }, [mode, playerColor, camera]);

  // Parse board state
  const boardData: BoardSquare[] = useMemo(() => {
    const board = game.board();
    const squares: BoardSquare[] = [];

    board.forEach((row, rankIndex) => {
      row.forEach((piece, fileIndex) => {
        const file = String.fromCharCode(97 + fileIndex); // a, b, c...
        const rank = 8 - rankIndex; // 8, 7, 6...
        const squareName = `${file}${rank}` as Square;

        const isBlack = (fileIndex + rankIndex) % 2 === 1;

        squares.push({
          square: squareName,
          piece: piece,
          position: getPosition(fileIndex, rankIndex),
          color: isBlack ? BLACK_SQUARE_COLOR : WHITE_SQUARE_COLOR
        });
      });
    });
    return squares;
  }, [game.fen()]);

  // Calculate move hints for selected piece
  const possibleMoves = useMemo(() => {
    if (!selectedSquare) return [];
    return game.moves({ square: selectedSquare, verbose: true }).map((m: any) => m.to);
  }, [selectedSquare, game.fen()]);

  const handleSquareClick = (squareName: Square) => {
    // If clicking the same square, deselect
    if (selectedSquare === squareName) {
      setSelectedSquare(null);
      return;
    }

    // If clicking a valid destination for the selected piece, move
    if (selectedSquare && possibleMoves.includes(squareName)) {
      onMove(selectedSquare, squareName);
      setSelectedSquare(null);
      return;
    }

    // If clicking a piece that belongs to the current turn's color, select it
    const piece = game.get(squareName);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(squareName);
    } else {
      setSelectedSquare(null);
    }
  };

  const isCheck = game.inCheck();
  const kingSquare = useMemo(() => {
    if (!isCheck) return null;
    // Find the king of the current turn
    const turn = game.turn();
    for(const sq of boardData) {
      if (sq.piece && sq.piece.type === 'k' && sq.piece.color === turn) {
          return sq.square;
      }
    }
    return null;
  }, [isCheck, game.fen()]);

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={10}
        maxDistance={25}
        target={[0, 0, 0]}
      />
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 15, 10]} intensity={1.5} castShadow />
      <spotLight position={[-10, 15, -5]} intensity={1} angle={0.3} penumbra={1} castShadow />
      <Environment preset="city" />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* Board Base */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[BOARD_SIZE * SQUARE_SIZE + 1, 1, BOARD_SIZE * SQUARE_SIZE + 1]} />
        <meshStandardMaterial color="#1f2937" roughness={0.6} />
      </mesh>

      {/* Squares & Pieces */}
      <group>
        {boardData.map((sq) => {
            const isSelected = selectedSquare === sq.square;
            const isHint = possibleMoves.includes(sq.square);
            const isKingInCheck = sq.square === kingSquare;
            const isAiDest = aiHint?.to === sq.square;
            const isAiSource = aiHint?.from === sq.square;

            let materialColor = sq.color;
            if (isSelected) materialColor = HIGHLIGHT_COLOR;
            else if (isKingInCheck) materialColor = CHECK_COLOR;
            else if (isAiDest) materialColor = "#f97316"; // Orange for AI hint destination
            else if (isHint) materialColor = MOVE_HINT_COLOR;

            return (
              <group key={sq.square}>
                {/* The Square */}
                <mesh
                  position={[sq.position[0], 0, sq.position[2]]}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSquareClick(sq.square);
                  }}
                >
                  <boxGeometry args={[SQUARE_SIZE, 0.2, SQUARE_SIZE]} />
                  <meshStandardMaterial color={materialColor} roughness={0.8} />
                </mesh>


                {/* The Piece */}
                {sq.piece && (
                  <Piece
                    type={sq.piece.type}
                    color={sq.piece.color}
                    position={sq.position}
                    isSelected={isSelected}
                    isBlinking={isAiSource} // Blink if this is the AI source piece
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSquareClick(sq.square);
                    }}
                  />
                )}

                {/* Move Hint Marker (Dot) for empty squares */}
                {isHint && !sq.piece && (
                  <mesh position={[sq.position[0], 0.15, sq.position[2]]} rotation={[-Math.PI/2, 0, 0]}>
                      <circleGeometry args={[0.3, 32]} />
                      <meshStandardMaterial color={MOVE_HINT_COLOR} transparent opacity={0.6} />
                  </mesh>
                )}
              </group>
            );
        })}
      </group>

      <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={40} blur={2} far={4} />
    </>
  );
};
