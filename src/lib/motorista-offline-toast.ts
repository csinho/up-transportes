import type { UUID } from "@/types";

const TOAST_KEY = "erp_transp_motorista_offline_ready_toast_v1";

export function shouldShowOfflineReadyToast(tenantId: UUID): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(TOAST_KEY) !== tenantId;
  } catch {
    return true;
  }
}

export function markOfflineReadyToastShown(tenantId: UUID): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TOAST_KEY, tenantId);
  } catch {
    /* ignore */
  }
}

export function clearOfflineReadyToastFlag(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOAST_KEY);
  } catch {
    /* ignore */
  }
}
