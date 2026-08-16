export type WorkspacePrimaryRouteId =
  | "home"
  | "orders"
  | "invoices"
  | "storefront"
  | "production"
  | "recipes"
  | "inventory"
  | "customers"
  | "finances"
  | "settings";

export type WorkspaceUtilityRouteId = "payment-settings" | "account" | "more";

export type WorkspaceRouteId = WorkspacePrimaryRouteId | WorkspaceUtilityRouteId;
export type WorkspacePath = `/${string}`;

export type WorkspaceRoute = {
  id: WorkspaceRouteId;
  label: string;
  path: WorkspacePath;
  aliases: readonly WorkspacePath[];
  kind: "primary" | "utility";
};

/**
 * The workspace boundary owns access control. This registry only maps already
 * authorized workspace destinations to stable, bakery-agnostic URLs.
 */
export const workspaceRouteRegistry: readonly WorkspaceRoute[] = [
  { id: "home", label: "Home", path: "/home", aliases: ["/app", "/app/home", "/app/dashboard"], kind: "primary" },
  { id: "orders", label: "Orders", path: "/orders", aliases: ["/app/orders"], kind: "primary" },
  { id: "invoices", label: "Invoices", path: "/invoices", aliases: ["/app/invoices"], kind: "primary" },
  { id: "storefront", label: "Online Store", path: "/storefront", aliases: ["/app/storefront", "/app/settings/store"], kind: "primary" },
  { id: "production", label: "Production", path: "/production", aliases: ["/app/production"], kind: "primary" },
  { id: "recipes", label: "Recipes", path: "/recipes", aliases: ["/app/recipes"], kind: "primary" },
  { id: "inventory", label: "Inventory", path: "/inventory", aliases: ["/app/inventory"], kind: "primary" },
  { id: "customers", label: "Customers", path: "/customers", aliases: ["/app/customers"], kind: "primary" },
  { id: "finances", label: "Finances", path: "/finances", aliases: ["/app/finances"], kind: "primary" },
  { id: "settings", label: "Settings", path: "/settings", aliases: ["/app/settings"], kind: "primary" },
  { id: "payment-settings", label: "Payment Settings", path: "/invoices/payment-settings", aliases: ["/app/payment-settings"], kind: "utility" },
  { id: "account", label: "Account & Profile", path: "/settings/account", aliases: ["/app/account"], kind: "utility" },
  { id: "more", label: "More", path: "/more", aliases: ["/app/more"], kind: "utility" },
] as const;

function normalisePath(pathname: string): WorkspacePath {
  const path = pathname.split("?")[0].split("#")[0] || "/";
  return (path.length > 1 ? path.replace(/\/+$/, "") : path) as WorkspacePath;
}

export function getWorkspaceRoute(id: WorkspaceRouteId) {
  const route = workspaceRouteRegistry.find((candidate) => candidate.id === id);
  if (!route) {
    throw new Error(`Unknown workspace route: ${id}`);
  }
  return route;
}

export function workspacePath(id: WorkspaceRouteId) {
  return getWorkspaceRoute(id).path;
}

export type ResolvedWorkspaceRoute = {
  route: WorkspaceRoute;
  canonicalPath: WorkspacePath;
  isAlias: boolean;
};

export function resolveWorkspaceRoute(pathname: string): ResolvedWorkspaceRoute | undefined {
  const path = normalisePath(pathname);
  const route = workspaceRouteRegistry.find(
    (candidate) => candidate.path === path || candidate.aliases.includes(path),
  );

  return route
    ? { route, canonicalPath: route.path, isAlias: route.path !== path }
    : undefined;
}

export function isWorkspacePath(pathname: string) {
  const path = normalisePath(pathname);
  return resolveWorkspaceRoute(path) !== undefined || path === "/app" || path.startsWith("/app/");
}
