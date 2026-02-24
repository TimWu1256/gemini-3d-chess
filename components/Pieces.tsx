import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, PieceSymbol } from 'chess.js';
import { WHITE_PIECE_COLOR, BLACK_PIECE_COLOR } from '../constants';
import * as THREE from 'three';

interface PieceProps {
  type: PieceSymbol;
  color: Color;
  position: [number, number, number];
  isSelected: boolean;
  isBlinking?: boolean;
  onClick: (e: any) => void;
}

// Helper component to handle positioning and click events
const PieceGroup = ({
  children,
  position,
  onClick,
  isBlinking
}: {
  children: React.ReactNode;
  position: [number, number, number];
  onClick: (e: any) => void;
  isBlinking?: boolean;
}) => {
    const groupRef = useRef<THREE.Group>(null);
    
    useFrame(({ clock }) => {
        if (isBlinking && groupRef.current) {
            const t = clock.getElapsedTime();
            const opacity = 0.5 + 0.5 * Math.sin(t * 5); // Pulse between 0.5 and 1
            
            groupRef.current.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material) {
                    // Clone simple logic to avoid messing with shared materials too much
                    // Ideally we should use instances but for this scale it's fine
                    if (!child.userData.originalColor) {
                        child.userData.originalColor = child.material.color.clone();
                    }
                    
                    // Pulse emissive
                    const val = (Math.sin(t * 8) + 1) / 2; // 0 to 1
                    child.material.emissive.setRGB(val * 0.5, val * 0.5, 0); // Yellowish pulse
                    child.material.emissiveIntensity = val;
                }
            });
        }
    });
    
    // Reset emissive when not blinking
    useEffect(() => {
        if (!isBlinking && groupRef.current) {
             groupRef.current.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material) {
                    child.material.emissive.setHex(0x000000);
                    child.material.emissiveIntensity = 0;
                }
            });
        }
    }, [isBlinking]);

    return (
      <group ref={groupRef} position={position} onClick={onClick}>
        {children}
      </group>
    );
};


// Geometric primitives for a Bauhaus/Modern style chess set
export const Piece: React.FC<PieceProps> = ({ type, color, position, isSelected, isBlinking, onClick }) => {
  const meshColor = isSelected ? '#3b82f6' : (color === 'w' ? WHITE_PIECE_COLOR : BLACK_PIECE_COLOR);
  const materialProps = { color: meshColor, roughness: 0.3, metalness: 0.5 };

  // Slight hover effect if selected
  const visualPosition: [number, number, number] = [
    position[0],
    position[1] + (isSelected ? 0.5 : 0),
    position[2]
  ];

  switch (type) {
    case 'p': // Pawn: Sphere on small base
      return (
        <PieceGroup position={visualPosition} onClick={onClick} isBlinking={isBlinking}>
          <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.5, 0.6, 0.4, 16]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0, 0.8, 0]} castShadow>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </PieceGroup>
      );
    case 'r': // Rook: Cube
      return (
        <PieceGroup position={visualPosition} onClick={onClick} isBlinking={isBlinking}>
          <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.9, 1.5, 0.9]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0, 1.6, 0]} castShadow>
            <boxGeometry args={[0.7, 0.2, 0.7]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </PieceGroup>
      );
    case 'n': // Knight: L-shape stylized
      return (
        <PieceGroup position={visualPosition} onClick={onClick} isBlinking={isBlinking}>
          <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.5, 0.6, 0.8, 16]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0, 1.0, 0]} rotation={[0, color === 'w' ? -Math.PI/2 : Math.PI/2, 0]} castShadow>
            <boxGeometry args={[0.4, 0.8, 1.0]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0, 1.5, color === 'w' ? 0.3 : -0.3]} rotation={[Math.PI/4, 0, 0]} castShadow>
            <boxGeometry args={[0.3, 0.4, 0.6]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </PieceGroup>
      );
    case 'b': // Bishop: Tall Cylinder with slit (simulated by top cone)
      return (
        <PieceGroup position={visualPosition} onClick={onClick} isBlinking={isBlinking}>
          <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.4, 0.6, 1.8, 16]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0, 1.9, 0]} castShadow>
            <coneGeometry args={[0.4, 0.6, 16]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </PieceGroup>
      );
    case 'q': // Queen: Cylinder + Sphere + Crown
      return (
        <PieceGroup position={visualPosition} onClick={onClick} isBlinking={isBlinking}>
          <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.45, 0.7, 2.0, 16]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0, 2.2, 0]} castShadow>
            <dodecahedronGeometry args={[0.5]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </PieceGroup>
      );
    case 'k': // King: Tall block + Cross (simulated by small cubes)
      return (
        <PieceGroup position={visualPosition} onClick={onClick} isBlinking={isBlinking}>
          <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.8, 2.2, 0.8]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0, 2.5, 0]} castShadow>
            <boxGeometry args={[0.3, 0.6, 0.3]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0, 2.5, 0]} castShadow>
            <boxGeometry args={[0.6, 0.3, 0.3]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </PieceGroup>
      );
    default:
      return null;
  }
};