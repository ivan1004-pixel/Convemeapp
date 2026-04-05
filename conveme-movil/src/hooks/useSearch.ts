import { useState, useMemo, useCallback } from 'react';

export function useSearch<T>(
  items: T[],
  searchKeys: (keyof T)[],
  initialQuery = ''
) {
  const [query, setQuery] = useState(initialQuery);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase().trim();
    return items.filter((item) =>
      searchKeys.some((key) => {
        const val = item[key];
        return typeof val === 'string' && val.toLowerCase().includes(q);
      })
    );
  }, [items, query, searchKeys]);

  const clearSearch = useCallback(() => setQuery(''), []);

  return { query, setQuery, filtered, clearSearch };
}
