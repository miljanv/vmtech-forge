import {
  LayoutDashboard,
  Building2,
  Kanban,
  Sparkles,
  Settings,
} from "lucide-react";

export const ADMIN_NAV = [
  { href: "/admin", label: "Kontrolna tabla", icon: LayoutDashboard },
  { href: "/admin/companies", label: "Firme i sajtovi", icon: Building2 },
  { href: "/admin/pipeline", label: "Prodajni proces", icon: Kanban },
  { href: "/admin/generations", label: "Generisanja", icon: Sparkles },
  { href: "/admin/settings", label: "Podešavanja", icon: Settings },
] as const;
