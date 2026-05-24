export const LIST_PAGE_SIZE = 10;
export const FILTER_ALL = "__all__";

export function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function matchesSearch(haystack: string | undefined | null, query: string): boolean {
  if (!query) return true;
  if (!haystack) return false;
  return normalizeSearch(haystack).includes(query);
}

export function matchesAny(values: (string | number | undefined | null)[], query: string): boolean {
  if (!query) return true;
  return values.some((v) => v != null && matchesSearch(String(v), query));
}

export function pageRange(page: number, pageSize: number, total: number) {
  if (total === 0) return { from: 0, to: 0 };
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return { from, to };
}
