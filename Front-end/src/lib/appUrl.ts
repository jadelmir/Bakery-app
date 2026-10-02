function normalisePath(pathname: string): string {
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (withLeadingSlash.length === 1) return withLeadingSlash;
  return `/${withLeadingSlash.replace(/^\/+|\/+$/g, "")}`;
}

export function appBasePath(basePath = import.meta.env.BASE_URL): string {
  const normalised = normalisePath(basePath || "/");
  return normalised === "/" ? "" : normalised;
}

export function appPath(pathname: string, basePath = import.meta.env.BASE_URL): string {
  const path = normalisePath(pathname);
  const prefix = appBasePath(basePath);
  return `${prefix}${path === "/" ? "/" : path}`;
}

export function browserRoutePath(
  pathname = window.location.pathname,
  basePath = import.meta.env.BASE_URL,
): string {
  const path = normalisePath(pathname);
  const prefix = appBasePath(basePath);
  if (!prefix) return path;
  if (path === prefix) return "/";
  if (path.startsWith(`${prefix}/`)) return path.slice(prefix.length) || "/";
  return path;
}

export function appUrl(
  pathname: string,
  origin = window.location.origin,
  basePath = import.meta.env.BASE_URL,
): string {
  return new URL(appPath(pathname, basePath), origin).toString();
}
