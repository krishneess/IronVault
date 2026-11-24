import { LayoutDashboard, Settings } from 'lucide-react';

/**
 * Sidebar navigation per role. Each later phase adds its modules here;
 * only routes that exist are listed so no link is a dead end.
 */
export const NAVIGATION = {
  member: [
    { section: 'Overview', items: [{ to: '/member', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
    { section: 'Account', items: [{ to: '/member/settings', label: 'Account Settings', icon: Settings }] },
  ],
  trainer: [
    { section: 'Overview', items: [{ to: '/trainer', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
    { section: 'Account', items: [{ to: '/trainer/settings', label: 'Account Settings', icon: Settings }] },
  ],
  admin: [
    { section: 'Overview', items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
    { section: 'Account', items: [{ to: '/admin/settings', label: 'Account Settings', icon: Settings }] },
  ],
};

/** Finds the nav label for the current path (used as the top bar title). */
export function findNavLabel(role, pathname) {
  const items = (NAVIGATION[role] || []).flatMap((s) => s.items);
  const exact = items.find((i) => i.to === pathname);
  if (exact) return exact.label;
  const prefix = items
    .filter((i) => !i.end && pathname.startsWith(`${i.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0];
  return prefix?.label || 'Dashboard';
}
