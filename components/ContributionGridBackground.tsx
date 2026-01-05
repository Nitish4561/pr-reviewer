'use client';

import { useEffect, useState } from 'react';

const ROWS = 7;
const COLS = 52;
const CELL = 14;
const GAP = 6;

type Cell = {
  id: number;
  x: number;
  y: number;
  intensity: number;
};

// Generate initial cells outside component to avoid SSR issues
const generateInitialCells = (): Cell[] => {
  const initial: Cell[] = [];
  let id = 0;

  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      initial.push({
        id: id++,
        x: col * (CELL + GAP),
        y: row * (CELL + GAP),
        intensity: Math.random(),
      });
    }
  }
  return initial;
};

export default function ContributionGridBackground() {
  const [cells, setCells] = useState<Cell[]>(() => generateInitialCells());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log("🎨 ContributionGridBackground component mounted");
    setMounted(true);
    
    // Regenerate cells on mount to ensure fresh random values
    setCells(generateInitialCells());
    console.log("🔢 Generated", cells.length, "cells for contribution grid");

    const interval = setInterval(() => {
      setCells(prev =>
        prev.map(cell =>
          Math.random() > 0.92
            ? { ...cell, intensity: Math.random() }
            : cell
        )
      );
    }, 900);

    return () => clearInterval(interval);
  }, []);

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) {
    return <div className="fixed inset-0 -z-10 overflow-hidden bg-black" />;
  }

  console.log("🎨 Rendering ContributionGridBackground with", cells.length, "cells");
  
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
      {/* Fallback gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-green-900/20" />
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${COLS * (CELL + GAP)} ${ROWS * (CELL + GAP)}`}
        preserveAspectRatio="xMidYMid slice"
        className="opacity-90"
      >
        <defs>
          <radialGradient id="glow" r="65%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="1" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </radialGradient>

          <filter id="softGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {cells.length > 0 ? cells.map(cell => {
          const alpha = 0.15 + cell.intensity * 0.85;

          return (
            <g key={cell.id}>
              {/* Glow */}
              <rect
                x={cell.x - 4}
                y={cell.y - 4}
                width={CELL + 8}
                height={CELL + 8}
                rx="6"
                fill="url(#glow)"
                opacity={alpha * 0.4}
              />

              {/* Core cell */}
              <rect
                x={cell.x}
                y={cell.y}
                width={CELL}
                height={CELL}
                rx="4"
                fill="#22c55e"
                opacity={alpha}
                filter="url(#softGlow)"
              />
            </g>
          );
        }) : (
          // Fallback static grid if cells aren't loaded
          Array.from({ length: 50 }, (_, i) => (
            <rect
              key={`fallback-${i}`}
              x={(i % 10) * 60}
              y={Math.floor(i / 10) * 60}
              width="40"
              height="40"
              rx="4"
              fill="#22c55e"
              opacity="0.3"
            />
          ))
        )}
      </svg>

      {/* Vignette overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
    </div>
  );
}
