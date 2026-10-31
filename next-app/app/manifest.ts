import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gaav2Ghar | गावाकडचे धान्य, घरपोच",
    short_name: "Gaav2Ghar",
    description: "शेतकऱ्यांकडून निवडलेले धान्य आता थेट तुमच्या घरी.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfaf6",
    theme_color: "#1f5b3b",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
