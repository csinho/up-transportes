import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/plataforma")({
  head: () => ({
    meta: [{ title: "Plataforma — Administração" }],
  }),
  component: () => <Outlet />,
});
