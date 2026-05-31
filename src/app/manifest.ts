// File: src/app/manifest.ts
import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AxiomPips - Precision Forex Calculators",
    short_name: "AxiomPips",
    description:
      "High-performance forex calculators and trading tools crafted for precision and speed.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d0e11",
    theme_color: "#06b6d4",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}