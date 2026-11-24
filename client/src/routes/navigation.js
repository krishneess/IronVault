import { Crown, CreditCard, Dumbbell, FileBarChart, LayoutDashboard, LineChart, Salad, ScrollText, Settings, UserCheck, UserRound, Users, UserCog } from 'lucide-react';

/**
 * Sidebar navigation per role. Each phase adds its modules here;
 * only routes that exist are listed so no link is a dead end.
 */
export const NAVIGATION = {
  member: [
    { section: 'Overview', items: [{ to: '/member', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
    {
      section: 'Training',
      items: [
        { to: '/member/workouts', label: 'Workout Plan', icon: Dumbbell },
        { to: '/member/diet', label: 'Diet Plan', icon: Salad },
        { to: '/member/progress', label: 'Progress', icon: LineChart },
        { to: '/member/trainer', label: 'My Trainer', icon: UserCog },
      ],
    },
    {
      section: 'Account',
      items: [
        { to: '/member/membership', label: 'Membership', icon: Crown },
        { to: '/member/profile', label: 'My Profile', icon: UserRound },
        { to: '/member/settings', label: 'Account Settings', icon: Settings },
      ],
    },
  ],
  trainer: [
    { section: 'Overview', items: [{ to: '/trainer', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
    {
      section: 'Coaching',
      items: [
        { to: '/trainer/members', label: 'My Members', icon: Users },
        { to: '/trainer/workout-plans', label: 'Workout Plans', icon: Dumbbell },
        { to: '/trainer/diet-plans', label: 'Diet Plans', icon: Salad },
      ],
    },
    {
      section: 'Account',
      items: [
        { to: '/trainer/profile', label: 'My Profile', icon: UserRound },
        { to: '/trainer/settings', label: 'Account Settings', icon: Settings },
      ],
    },
  ],
  admin: [
    { section: 'Overview', items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
    {
      section: 'People',
      items: [
        { to: '/admin/members', label: 'Members', icon: Users },
        { to: '/admin/trainers', label: 'Trainers', icon: UserCog },
        { to: '/admin/allocation', label: 'Trainer Allocation', icon: UserCheck },
      ],
    },
    {
      section: 'Memberships',
      items: [
        { to: '/admin/memberships', label: 'Subscriptions', icon: CreditCard },
        { to: '/admin/tiers', label: 'Membership Tiers', icon: Crown },
      ],
    },
    {
      section: 'Insights',
      items: [
        { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
        { to: '/admin/activity', label: 'Activity Log', icon: ScrollText },
      ],
    },
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
