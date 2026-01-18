
import React from 'react';

export const WindRose: React.FC<{ activeSector: number }> = ({ activeSector }) => {
  const sectors = 16;
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <circle cx="100" cy="100" r="90" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
      <circle cx="100" cy="100" r="60" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
      <circle cx="100" cy="100" r="30" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
      {[...Array(sectors)].map((_, i) => {
        const angle = (i * 360) / sectors;
        const isActive = i === activeSector;
        const length = isActive ? 85 : 40 + Math.random() * 20;
        return (
          <line
            key={i}
            x1="100"
            y1="100"
            x2={100 + length * Math.cos((angle * Math.PI) / 180)}
            y2={100 + length * Math.sin((angle * Math.PI) / 180)}
            stroke={isActive ? '#3b82f6' : '#94a3b8'}
            strokeWidth={isActive ? '3' : '1'}
            className="transition-all duration-700"
          />
        );
      })}
    </svg>
  );
};

export const MeshGrid: React.FC<{ density: number }> = ({ density }) => {
  const size = 20;
  const lines = Math.floor(density);
  return (
    <div className="relative w-full h-64 border border-slate-200 bg-slate-50 overflow-hidden">
      {[...Array(lines)].map((_, i) => (
        <div
          key={`h-${i}`}
          className="absolute w-full h-px bg-slate-200"
          style={{ top: `${(i * 100) / lines}%` }}
        />
      ))}
      {[...Array(lines)].map((_, i) => (
        <div
          key={`v-${i}`}
          className="absolute h-full w-px bg-slate-200"
          style={{ left: `${(i * 100) / lines}%` }}
        />
      ))}
    </div>
  );
};

export const LogProfile: React.FC = () => (
  <svg viewBox="0 0 200 150" className="w-full h-full">
    <path
      d="M 20 130 Q 180 130 180 20"
      fill="none"
      stroke="#3b82f6"
      strokeWidth="2"
    />
    <line x1="20" y1="130" x2="190" y2="130" stroke="#000" strokeWidth="1" />
    <line x1="20" y1="130" x2="20" y2="10" stroke="#000" strokeWidth="1" />
    <text x="100" y="145" fontSize="8" textAnchor="middle">Wind Velocity (U)</text>
    <text x="5" y="75" fontSize="8" textAnchor="middle" transform="rotate(-90 5 75)">Height (z)</text>
    <circle cx="45" cy="115" r="3" fill="#ef4444" />
    <text x="55" y="118" fontSize="6">1.75m Pedestrian Level</text>
  </svg>
);
