/** Official product name shown in chrome, auth screens, and document titles. */
export const APP_NAME = "SRC Foreign Travel Authority";

/** Compact label for narrow headers and mobile nav. */
export const APP_NAME_SHORT = "SRC FTA";

export const APP_ADMIN_TITLE = `${APP_NAME_SHORT} Admin`;

export const APP_PORTAL_TITLE = `${APP_NAME_SHORT} Portal`;

/** `<title>` helper — e.g. `Sign in | SRC Foreign Travel Authority`. */
export function appPageTitle(pageLabel: string): string {
  const page = pageLabel.trim();
  if (!page) return APP_NAME;
  return `${page} | ${APP_NAME}`;
}
