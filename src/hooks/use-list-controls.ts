import { useEffect, useMemo, useState } from "react";
import { FILTER_ALL, LIST_PAGE_SIZE, normalizeSearch } from "@/lib/list-utils";

export type UseListControlsOptions<T> = {
  items: T[];
  pageSize?: number;
  searchFn?: (item: T, query: string) => boolean;
  filterFn?: (item: T, filters: Record<string, string>) => boolean;
  initialFilters?: Record<string, string>;
};

export function useListControls<T>({
  items,
  pageSize = LIST_PAGE_SIZE,
  searchFn,
  filterFn,
  initialFilters = {},
}: UseListControlsOptions<T>) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters);
  const [page, setPage] = useState(1);

  const query = useMemo(() => normalizeSearch(search), [search]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (query && searchFn && !searchFn(item, query)) return false;
      if (filterFn) {
        const active = Object.entries(filters).some(
          ([, value]) => value && value !== FILTER_ALL,
        );
        if (active && !filterFn(item, filters)) return false;
      }
      return true;
    });
  }, [items, query, filters, searchFn, filterFn]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [search, filters, items.length]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const setFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const hasActiveFilters =
    !!query ||
    Object.values(filters).some((v) => v && v !== FILTER_ALL);

  return {
    search,
    setSearch,
    filters,
    setFilter,
    page: safePage,
    setPage,
    filtered,
    paginated,
    totalItems: filtered.length,
    totalPages,
    pageSize,
    hasActiveFilters,
  };
}
