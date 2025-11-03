'use client';

import { motion } from 'framer-motion';

export function FloatingOrbs() {
  const orbs = [
    { size: 400, mobileSize: 250, color: 'rgba(139, 92, 246, 0.15)', blur: 80, mobileBlur: 50, x: '10%', y: '20%', duration: 20 },
    { size: 500, mobileSize: 300, color: 'rgba(59, 130, 246, 0.12)', blur: 100, mobileBlur: 60, x: '80%', y: '60%', duration: 25 },
    { size: 350, mobileSize: 220, color: 'rgba(236, 72, 153, 0.1)', blur: 90, mobileBlur: 55, x: '50%', y: '80%', duration: 22 },
    { size: 300, mobileSize: 200, color: 'rgba(139, 92, 246, 0.08)', blur: 70, mobileBlur: 45, x: '70%', y: '30%', duration: 18 },
    { size: 450, mobileSize: 280, color: 'rgba(59, 130, 246, 0.1)', blur: 95, mobileBlur: 60, x: '30%', y: '70%', duration: 23 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {orbs.map((orb, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle at center, ${orb.color} 0%, transparent 70%)`,
            filter: `blur(${orb.blur}px)`,
            left: orb.x,
            top: orb.y,
          }}
          animate={{
            x: [0, 100, -50, 50, 0],
            y: [0, -80, 100, -60, 0],
            scale: [1, 1.2, 0.9, 1.1, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <style jsx>{`
            @media (max-width: 768px) {
              div {
                width: ${orb.mobileSize}px !important;
                height: ${orb.mobileSize}px !important;
                filter: blur(${orb.mobileBlur}px) !important;
              }
            }
          `}</style>
        </motion.div>
      ))}
    </div>
  );
}
