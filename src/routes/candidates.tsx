import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout route for the /candidates subtree. The list page lives in
// candidates.index.tsx and the apply/certificate/dashboard pages are children
// (candidates.apply.tsx, candidates.$candidateId.*.tsx). This layout only
// renders an <Outlet /> so each child page owns its own chrome.
export const Route = createFileRoute("/candidates")({
  component: CandidatesLayout,
});

function CandidatesLayout() {
  return <Outlet />;
}
