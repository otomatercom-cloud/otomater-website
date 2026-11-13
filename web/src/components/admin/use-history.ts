"use client";
import { useCallback, useRef, useState } from "react";

/** Undo/redo with coalescing: edits sharing a `group` within 800 ms collapse into one step (typing != 40 undo steps). */
export function useHistory<T>(initial: T) {
  const [present, setPresent] = useState<T>(initial);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const last = useRef<{ group: string; at: number }>({ group: "", at: 0 });
  const [, tick] = useState(0);

  const set = useCallback((next: T | ((p: T) => T), group = "") => {
    setPresent((p) => {
      const n = typeof next === "function" ? (next as (p: T) => T)(p) : next;
      const now = Date.now();
      const merge = group !== "" && last.current.group === group && now - last.current.at < 800;
      if (!merge) { past.current = [...past.current.slice(-79), p]; }
      last.current = { group, at: now };
      future.current = [];
      return n;
    });
    tick((x) => x + 1);
  }, []);
  const reset = useCallback((v: T) => { past.current = []; future.current = []; last.current = { group: "", at: 0 }; setPresent(v); tick((x) => x + 1); }, []);
  const undo = useCallback(() => setPresent((p) => { const prev = past.current.pop(); if (prev === undefined) return p; future.current.push(p); last.current = { group: "", at: 0 }; tick((x) => x + 1); return prev; }), []);
  const redo = useCallback(() => setPresent((p) => { const nx = future.current.pop(); if (nx === undefined) return p; past.current.push(p); last.current = { group: "", at: 0 }; tick((x) => x + 1); return nx; }), []);
  return { present, set, reset, undo, redo, canUndo: past.current.length > 0, canRedo: future.current.length > 0 };
}
