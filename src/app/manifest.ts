import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Condorin · Alertas de minería ilegal",
    short_name: "Condorin",
    description: "Alertas de dragas y minería ilegal de tajo abierto por WhatsApp.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#e11d2e",
    icons: [
      { src: "/brand/favicon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/favicon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
