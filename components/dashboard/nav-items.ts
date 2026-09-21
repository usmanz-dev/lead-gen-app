import {
  LayoutDashboard,
  Search,
  Users,
  Send,
  KanbanSquare,
  MapPin,
  FileBarChart,
  UsersRound,
  CreditCard,
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
  {
    label: "New Lead Search",
    href: "/dashboard/search",
    icon: Search,
    comingSoon: true,
  },
  { label: "Leads", href: "/dashboard/leads", icon: Users, comingSoon: true },
  {
    label: "Campaigns",
    href: "/dashboard/campaigns",
    icon: Send,
    comingSoon: true,
  },
  {
    label: "CRM Pipeline",
    href: "/dashboard/pipeline",
    icon: KanbanSquare,
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
];
