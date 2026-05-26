import { createFileRoute, Outlet } from "@tanstack/react-router";
import { hydrateMotoristaCacheBeforeLoad } from "@/lib/motorista-route-cache";

export const Route = createFileRoute("/motorista/viagens/$id")({
  beforeLoad: ({ context }) => hydrateMotoristaCacheBeforeLoad(context),
  component: () => <Outlet />,
});
