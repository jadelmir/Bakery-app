import type { ReactNode } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router";

import { workspacePath, workspaceRouteRegistry, type WorkspaceRoute } from "./routeRegistry";

export type WorkspaceRoutesProps = {
  renderRoute: (route: WorkspaceRoute) => ReactNode;
  fallback?: ReactNode;
};

/**
 * Render this only beneath the existing authenticated, active-bakery boundary.
 * It deliberately contains no auth, public-route, or bakery-id logic.
 */
export function WorkspaceRoutes({ renderRoute, fallback }: WorkspaceRoutesProps) {
  return (
    <Routes>
      {workspaceRouteRegistry.map((route) => (
        <Route key={route.id} path={route.path} element={<>{renderRoute(route)}</>} />
      ))}
      {workspaceRouteRegistry.flatMap((route) =>
        route.aliases.map((alias) => (
          <Route key={alias} path={alias} element={<Navigate replace to={route.path} />} />
        )),
      )}
      <Route path="*" element={fallback ?? <WorkspaceNotFound />} />
    </Routes>
  );
}

export function WorkspaceNotFound() {
  const location = useLocation();

  return (
    <main aria-labelledby="workspace-not-found-title" className="p-6">
      <h1 id="workspace-not-found-title" className="text-lg font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The workspace page <code>{location.pathname}</code> is not available.
      </p>
      <Link className="mt-4 inline-block text-sm underline" to={workspacePath("home")}>
        Return to Home
      </Link>
    </main>
  );
}
