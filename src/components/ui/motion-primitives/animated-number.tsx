'use client';

import React, { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export interface AnimatedNumberProps {
  value: number;
  className?: string;
  springOptions?: {
    bounce?: number;
    duration?: number;
    stiffness?: number;
    damping?: number;
  };
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

export function AnimatedNumber({
  value,
  className = '',
  springOptions = { stiffness: 100, damping: 20 },
  decimals = 2,
  prefix = '',
  suffix = ''
}: AnimatedNumberProps) {
  const isFirstRender = useRef(true);
  const spring = useSpring(value, springOptions);
  const display = useTransform(spring, (current) => {
    return `${prefix}${current.toFixed(decimals)}${suffix}`;
  });

  useEffect(() => {
    // REGLA OBLIGATORIA: Animar solo en cambios de valor, no en el primer montaje
    if (isFirstRender.current) {
      isFirstRender.current = false;
      spring.set(value);
    } else {
      spring.set(value);
    }
  }, [value, spring]);

  return <motion.span className={className}>{display}</motion.span>;
}
