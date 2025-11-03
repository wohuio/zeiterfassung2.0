'use client';

import { motion } from 'framer-motion';

interface AnimatedIconProps {
  children: React.ReactNode;
  variant?: 'glow' | 'pulse' | 'rotate' | 'float' | 'bounce';
  color?: 'purple' | 'blue' | 'pink' | 'gradient';
}

export function AnimatedIcon({ children, variant = 'glow', color = 'gradient' }: AnimatedIconProps) {
  const colorClasses = {
    purple: 'icon-glow-purple',
    blue: 'icon-glow-blue',
    pink: 'icon-glow-pink',
    gradient: 'icon-glow-gradient',
  };

  const variants = {
    glow: {
      animate: {
        scale: [1, 1.05, 1],
      },
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
    pulse: {
      animate: {
        scale: [1, 1.1, 1],
      },
      transition: { duration: 2, repeat: Infinity },
    },
    rotate: {
      animate: { rotate: 360 },
      transition: { duration: 4, repeat: Infinity, ease: 'linear' },
    },
    float: {
      animate: { y: [-10, 10, -10] },
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    },
    bounce: {
      animate: { y: [0, -20, 0] },
      transition: { duration: 2, repeat: Infinity, ease: 'easeOut' },
    },
  };

  return (
    <motion.div
      className={`inline-block ${colorClasses[color]}`}
      animate="animate"
      {...variants[variant]}
    >
      {children}
    </motion.div>
  );
}
