import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout route for the /elections subtree. The elections hall lives in
// elections.index.tsx and the position/candidates pages are children
// (elections.$positionId.tsx, elections.candidates.$positionId.tsx). This
// layout only renders an <Outlet /> so each child page owns its own chrome.
export const Route = createFileRoute("/elections")({
  component: ElectionsLayout,
});

function ElectionsLayout() {
  return <Outlet />;
}
