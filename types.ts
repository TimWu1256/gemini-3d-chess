import { Color, PieceSymbol, Square } from 'chess.js';
import React from 'react';

export interface GameState {
  fen: string;
  turn: Color;
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  history: string[];
}

export interface BoardSquare {
  square: Square;
  piece: { type: PieceSymbol; color: Color } | null;
  position: [number, number, number];
  color: string;
}

export interface Move {
  from: string;
  to: string;
  promotion?: string;
}

export enum PlayerType {
  HUMAN = 'HUMAN',
  AI = 'AI',
  ONLINE = 'ONLINE'
}

export interface PeerMessage {
  type: 'MOVE' | 'SYNC' | 'RESET';
  data: any;
}

// Augment JSX namespace to include React Three Fiber elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      pointLight: any;
      spotLight: any;
      mesh: any;
      group: any;
      boxGeometry: any;
      sphereGeometry: any;
      cylinderGeometry: any;
      coneGeometry: any;
      dodecahedronGeometry: any;
      circleGeometry: any;
      meshStandardMaterial: any;
      color: any;
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      pointLight: any;
      spotLight: any;
      mesh: any;
      group: any;
      boxGeometry: any;
      sphereGeometry: any;
      cylinderGeometry: any;
      coneGeometry: any;
      dodecahedronGeometry: any;
      circleGeometry: any;
      meshStandardMaterial: any;
      color: any;
    }
  }
}