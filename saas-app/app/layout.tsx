import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Patente Facile Italia",
  description: "Aprenda para tirar a carta de motorista na Itália, no seu ritmo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
