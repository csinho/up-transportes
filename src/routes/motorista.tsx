import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ClientOnly } from "@/components/ClientOnly";
import { MotoristaErrorBoundary } from "@/components/motorista/MotoristaErrorBoundary";

export const Route = createFileRoute("/motorista")({
  head: () => ({
    meta: [
      { title: "App Motorista" },
      { name: "theme-color", content: "#0f172a" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Motorista" },
      { name: "mobile-web-app-capable", content: "yes" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  }),
  component: () => (
    <MotoristaErrorBoundary>
      <ClientOnly>
        <Outlet />
      </ClientOnly>
    </MotoristaErrorBoundary>
  ),
});
