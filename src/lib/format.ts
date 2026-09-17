export function formatBRL(v: number | null | undefined): string {
  const n = v ?? 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function formatBRLCents(v: number | null | undefined): string {
  const n = v ?? 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function iniciais(nome: string): string {
  return nome.trim().charAt(0).toUpperCase();
}

const CAT_COLORS = ["var(--cat-1)", "var(--cat-2)", "var(--cat-3)", "var(--cat-4)"];
export function corCategoria(idx: number): string {
  return idx < 4 ? CAT_COLORS[idx] : "var(--cat-neutral)";
}
