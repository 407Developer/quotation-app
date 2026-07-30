import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JOBON INTERNATIONAL LTD - Quotation App",
  description: "Automated quotation generation for flooring installations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
