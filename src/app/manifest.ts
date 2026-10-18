import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ojo de Cóndor · Panel",
    short_name: "Ojo de Cóndor",
    description: "Panel de administración de Ojo de Cóndor.",
    start_url: "/admin",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#e11d2e",
    icons: [
      { src: "/brand/favicon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/favicon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
