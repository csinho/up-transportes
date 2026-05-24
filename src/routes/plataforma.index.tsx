import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/plataforma/")({
  component: () => <Navigate to="/plataforma/transportadoras" replace />,
});
