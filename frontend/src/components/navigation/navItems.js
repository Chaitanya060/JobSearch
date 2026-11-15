import {
  LayoutDashboard,
  Search,
  Sparkles,
  Bookmark,
  ClipboardList,
  FileText,
  User,
  SlidersHorizontal,
  Settings,
  Shield,
  Database,
  Building2,
  History,
  Activity,
  Users,
} from 'lucide-react'

// Sidebar order per UI spec §6.
export const USER_NAV = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/jobs', label: 'Find jobs', icon: Search },
  { to: '/app/recommendations', label: 'Recommended', icon: Sparkles },
  { to: '/app/saved-jobs', label: 'Saved jobs', icon: Bookmark },
  { to: '/app/applications', label: 'Applications', icon: ClipboardList },
  { to: '/app/resumes', label: 'Resumes', icon: FileText },
  { to: '/app/profile', label: 'Profile', icon: User },
  { to: '/app/preferences', label: 'Preferences', icon: SlidersHorizontal },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

// Most-frequent destinations for mobile bottom nav.
export const MOBILE_PRIMARY = [
  { to: '/app', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/app/jobs', label: 'Jobs', icon: Search },
  { to: '/app/saved-jobs', label: 'Saved', icon: Bookmark },
  { to: '/app/applications', label: 'Tracker', icon: ClipboardList },
]

export const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', icon: Shield, end: true },
  { to: '/admin/sources', label: 'Job sources', icon: Database },
  { to: '/admin/board-targets', label: 'Board targets', icon: Building2 },
  { to: '/admin/collection-runs', label: 'Collection logs', icon: History },
  { to: '/admin/jobs', label: 'Job management', icon: Search },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/system-health', label: 'System health', icon: Activity },
]
