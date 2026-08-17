'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';

export interface TextEffectProps {
  children: string;
  className?: string;
  per?: 'word' | 'char';
  delay?: number;
}

const defaultContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const defaultChildVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 12,
      stiffness: 100,
    },
  },
};

export function TextEffect({
  children,
  className = '',
  per = 'word',
  delay = 0,
}: TextEffectProps) {
  const elements = per === 'word' ? children.split(' ') : children.split('');

  return (
    <motion.span
      className={`inline-block ${className}`}
      variants={defaultContainerVariants}
      initial="hidden"
      animate="visible"
      transition={{ delayChildren: delay }}
    >
      {elements.map((el, i) => (
        <motion.span
          key={i}
          variants={defaultChildVariants}
          className="inline-block"
        >
          {el}
          {per === 'word' && i < elements.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </motion.span>
  );
}
