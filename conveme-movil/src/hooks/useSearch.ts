import { useState, useMemo } from 'react';

export const useSearch = <T extends Record<string, unknown>>(
  items: T[],
  searchFields: (keyof T)[]
) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(item =>
      searchFields.some(field => {
        const val = item[field];
        return typeof val === 'string' && val.toLowerCase().includes(q);
      })
    );
  }, [items, query, searchFields]);

  return { query, setQuery, filtered };
};
