"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "motion/react";

/**
 * Counts from the previous price to the new one over a short duration
 * instead of jumping instantly when the billing interval toggles.
 */
export function AnimatedPrice({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    const controls = animate(previousValue.current, value, {
      duration: 0.35,
      ease: [0.4, 0, 0.2, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    previousValue.current = value;
    return () => controls.stop();
  }, [value]);

  return <span>${display}</span>;
}
