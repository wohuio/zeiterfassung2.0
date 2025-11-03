'use client';

import { motion } from 'framer-motion';

interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: 'gradient' | 'green' | 'red' | 'orange';
  label?: string;
  sublabel?: string;
  showPercentage?: boolean;
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  color = 'gradient',
  label,
  sublabel,
  showPercentage = true
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const getStrokeColor = () => {
    switch (color) {
      case 'green':
        return 'stroke-green-400';
      case 'red':
        return 'stroke-red-400';
      case 'orange':
        return 'stroke-orange-400';
      case 'gradient':
      default:
        return 'stroke-url(#gradient)';
    }
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90" style={{ overflow: 'visible' }}>
        {/* Gradient Definition */}
        <defs>
          <linearGradient id={`gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>

        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1f2937"
          strokeWidth={strokeWidth}
          opacity="0.2"
        />

        {/* Progress Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          stroke={color === 'gradient' ? `url(#gradient-${size})` : color === 'green' ? '#4ade80' : color === 'red' ? '#f87171' : '#fb923c'}
          strokeDashoffset={offset}
          transition={{ duration: 0.5, ease: 'linear' }}
        />
      </svg>

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && (
          <div className="text-4xl font-bold gradient-text mb-2">
            {label}
          </div>
        )}
        {sublabel && (
          <div className="text-lg text-text-secondary mb-2">
            {sublabel}
          </div>
        )}
        {showPercentage && (
          <div className="text-3xl font-bold text-purple-400">
            {Math.round(value)}%
          </div>
        )}
      </div>
    </div>
  );
}
