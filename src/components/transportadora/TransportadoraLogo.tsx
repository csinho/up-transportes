import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { resolveLogoUrl } from "@/lib/logo-url";
import { ensureMotoristaAnonymousSession } from "@/lib/supabase/motorista-auth";
import { useTransportadoraBranding } from "@/hooks/use-transportadora-branding";
import type { UUID } from "@/types";
import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
} as const;

type Props = {
  transportadoraId?: UUID;
  /** Sobrescreve dados do hook (ex.: após login já conhecido). */
  nomeFantasia?: string;
  logoUrl?: string;
  size?: keyof typeof SIZE_CLASS;
  showName?: boolean;
  className?: string;
  nameClassName?: string;
  /** motorista = sessão anônima para logo; none = ERP login público */
  sessionMode?: "motorista" | "none";
};

export function TransportadoraLogo({
  transportadoraId,
  nomeFantasia: nomeOverride,
  logoUrl: logoOverride,
  size = "md",
  showName = false,
  className,
  nameClassName,
  sessionMode = "motorista",
}: Props) {
  const { data: branding } = useTransportadoraBranding(transportadoraId);

  const nome = nomeOverride ?? branding?.nome_fantasia;
  const logoPath = logoOverride ?? branding?.logo_url;

  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    if (!logoPath || !transportadoraId) return;

    void (async () => {
      if (sessionMode === "motorista") {
        await ensureMotoristaAnonymousSession();
      }
      const url = await resolveLogoUrl(logoPath);
      if (!cancelled) setSrc(url);
    })();

    return () => {
      cancelled = true;
    };
  }, [logoPath, transportadoraId, sessionMode]);

  const boxClass = cn(
    "shrink-0 flex items-center justify-center rounded-lg border bg-background overflow-hidden",
    SIZE_CLASS[size],
    className,
  );

  return (
    <div className={cn("flex items-center gap-3 min-w-0", showName && "flex-col sm:flex-row")}>
      <div className={boxClass} aria-hidden={!nome}>
        {src ? (
          <img
            src={src}
            alt={nome ? `Logo ${nome}` : "Logo da transportadora"}
            className="h-full w-full object-contain p-1"
          />
        ) : (
          <Building2 className={cn("text-muted-foreground", size === "sm" ? "h-4 w-4" : "h-6 w-6")} />
        )}
      </div>
      {showName && nome && (
        <p className={cn("font-semibold text-center sm:text-left truncate", size === "lg" ? "text-lg" : "text-sm", nameClassName)}>
          {nome}
        </p>
      )}
    </div>
  );
}
