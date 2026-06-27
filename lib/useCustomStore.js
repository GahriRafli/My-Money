"use client";
import { useCallback, useEffect, useState } from "react";

export function useCustomStore(key, initial = []) {
  const [items, setItems] = useState(initial);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, [key]);

  const save = useCallback((next) => {
    setItems(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  }, [key]);

  const add = useCallback((item) => {
    setItems(prev => {
      const next = [...prev, item];
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);

  const remove = useCallback((id) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== id);
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);

  return { items, add, remove, save };
}
