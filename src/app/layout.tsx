import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { APP_NAME, APP_DESCRIPTION } from "@/constants";
import { inter, bebas } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={cn("font-sans", inter.variable, bebas.variable)} suppressHydrationWarning>
      <body className="min-h-screen antialiased" style={{ background: "#07090f", color: "#ffffff" }}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
