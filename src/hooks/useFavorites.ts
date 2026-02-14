import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "dv-favorites";

function readFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function writeFavorites(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage may be full or disabled
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(readFavorites);

  // Persist to localStorage whenever favorites change
  useEffect(() => {
    writeFavorites(favorites);
  }, [favorites]);

  const toggleFavorite = useCallback((planId: string) => {
    setFavorites((prev) =>
      prev.includes(planId)
        ? prev.filter((id) => id !== planId)
        : [...prev, planId]
    );
  }, []);

  const isFavorite = useCallback(
    (planId: string) => favorites.includes(planId),
    [favorites]
  );

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    favoritesCount: favorites.length,
  };
}
