import type { IconName } from "@/components/ui/Icon";

export type AdminSection = { href: string; label: string; description: string; icon: IconName };

/**
 * Every page of the panel. The sidebar and the overview cards are built from this list, so a new
 * section is one entry here plus its page under src/app/admin/(panel)/.
 */
export const ADMIN_SECTIONS: AdminSection[] = [
  { href: "/admin", label: "Resumen", description: "Cifras generales de Condorin.", icon: "grid" },
  { href: "/admin/en-vivo", label: "En vivo", description: "Detecciones del satélite y cada decisión, al instante.", icon: "radar" },
  { href: "/admin/usuarios", label: "Usuarios", description: "Personas que entraron con WhatsApp.", icon: "users" },
];
