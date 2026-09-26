import {
  LayoutDashboard,
  Search,
  Users,
  Send,
  MapPin,
  FileBarChart,
  UsersRound,
  CreditCard,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Set for features not yet built — rendered disabled, never a dead link. */
  comingSoon?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Lead Search", href: "/dashboard/search", icon: Search },
  { label: "Leads", href: "/dashboard/leads", icon: Users },
  {
    label: "Campaigns",
    href: "/dashboard/campaigns",
    icon: Send,
    comingSoon: true,
  },
  {
    label: "Rank Tracker",
    href: "/dashboard/rank-tracker",
    icon: MapPin,
    comingSoon: true,
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: FileBarChart,
    comingSoon: true,
  },
  {
    label: "Team",
    href: "/dashboard/team",
    icon: UsersRound,
    comingSoon: true,
  },
  {
    label: "Billing",
    href: "/dashboard/billing",
    icon: CreditCard,
    comingSoon: true,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    comingSoon: true,
  },
];
