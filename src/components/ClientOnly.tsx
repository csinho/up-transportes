import { useEffect, useState } from "react";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

/** Renderiza filhos só no browser — evita erro React #418 (hidratação) em conteúdo dinâmico. */
export function ClientOnly({ children, fallback = null }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return fallback;
  return children;
}
