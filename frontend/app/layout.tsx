import type { Metadata } from "next";
import { AppProviders } from "./components/providers/AppProviders";
import "./globals-dashboard.css";

export const metadata: Metadata = {
  title: "Multi Omics Dashboard",
  description: "Dashboard for multi-omics experiments and simulations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
