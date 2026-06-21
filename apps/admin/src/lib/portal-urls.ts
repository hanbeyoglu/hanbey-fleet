export const DRIVER_PORTAL_URL =
  import.meta.env.VITE_DRIVER_PORTAL_URL || 'http://localhost:5174';

export function redirectDriverToPortal(accessToken: string, refreshToken: string) {
  const hash = new URLSearchParams({ accessToken, refreshToken }).toString();
  window.location.href = `${DRIVER_PORTAL_URL}/auth/handoff#${hash}`;
}
