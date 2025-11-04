'use client';

import { motion } from 'framer-motion';
import {
  Clock, FileText, Calendar, BarChart3, Users, Settings, TrendingUp, Zap,
  AlertCircle, ArrowLeft, User, Shield, XCircle, CheckCircle, Briefcase, ArrowRight
} from 'lucide-react';

interface GlowIconProps {
  icon: 'clock' | 'file' | 'calendar' | 'chart' | 'users' | 'settings' | 'trending' | 'zap' |
        'alert-circle' | 'arrow-left' | 'user' | 'shield' | 'x-circle' | 'check-circle' |
        'briefcase' | 'arrow-right';
  size?: number | 'sm' | 'md' | 'lg';
  color?: 'purple' | 'blue' | 'pink' | 'gradient';
  variant?: 'static' | 'pulse' | 'float' | 'spin';
  className?: string;
}

export function GlowIcon({
  icon,
  size = 24,
  color = 'gradient',
  variant = 'pulse',
  className = ''
}: GlowIconProps) {
  const icons = {
    clock: Clock,
    file: FileText,
    calendar: Calendar,
    chart: BarChart3,
    users: Users,
    settings: Settings,
    trending: TrendingUp,
    zap: Zap,
    'alert-circle': AlertCircle,
    'arrow-left': ArrowLeft,
    user: User,
    shield: Shield,
    'x-circle': XCircle,
    'check-circle': CheckCircle,
    briefcase: Briefcase,
    'arrow-right': ArrowRight,
  };

  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  const iconSize = typeof size === 'string' ? sizeMap[size] : size;

  const Icon = icons[icon];

  const colorClasses = {
    purple: 'text-novu-400 icon-glow-purple',
    blue: 'text-blue-400 icon-glow-blue',
    pink: 'text-pink-400 icon-glow-pink',
    gradient: 'text-novu-400 icon-glow-gradient',
  };

  const variants = {
    static: {},
    pulse: {
      animate: {
        scale: [1, 1.08, 1],
      },
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    float: {
      animate: {
        y: [-4, 4, -4],
      },
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    spin: {
      animate: {
        rotate: 360,
      },
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };

  return (
    <motion.div
      className={`inline-flex items-center justify-center ${className}`}
      {...(variants[variant] || {})}
    >
      <Icon
        size={iconSize}
        className={colorClasses[color]}
        strokeWidth={2.5}
      />
    </motion.div>
  );
}
