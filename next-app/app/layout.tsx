import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gaav2Ghar | गावाकडचे धान्य, घरपोच",
  description: "शेतकऱ्यांकडून निवडलेले धान्य आता थेट तुमच्या घरी.",
  applicationName: "Gaav2Ghar",
};

export const viewport: Viewport = {
  themeColor: "#1f5b3b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="mr"><body>{children}</body></html>;
}
