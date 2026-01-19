"use client";

import { motion, type Variants, useReducedMotion } from "framer-motion";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Default: true */
  once?: boolean;
  /** Default: 0.2 */
  amount?: number;
  /** Default: 0.06 (subtle upward slide) */
  y?: number;
  /** Default: 0.35 */
  duration?: number;
  /** Default: 0.06 */
  delay?: number;
};

export function Reveal({
  children,
  className,
  once = true,
  amount = 0.2,
  y = 10,
  duration = 0.35,
  delay = 0,
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  const variants: Variants = reduceMotion
    ? {
        hidden: { opacity: 1 },
        show: { opacity: 1 },
      }
    : {
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration, delay } },
      };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
    >
      {children}
    </motion.div>
  );
}

