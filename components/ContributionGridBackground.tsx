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

export default function ContributionGridBackground() {
  const [cells, setCells] = useState<Cell[]>([]);

  useEffect(() => {
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

    setCells(initial);

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

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-black">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${COLS * (CELL + GAP)} ${ROWS * (CELL + GAP)}`}
        preserveAspectRatio="xMidYMid slice"
        className="opacity-80"
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

        {cells.map(cell => {
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
        })}
      </svg>

      {/* Vignette overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
    </div>
  );
}
