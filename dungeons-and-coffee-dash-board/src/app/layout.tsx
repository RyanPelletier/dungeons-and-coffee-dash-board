import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Dungeons & Coffee",
  description: "Campaign dashboard, player sheets, and session logs for the party.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <Providers>
          <NavBar />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
