import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Track Record — back artists before they blow up",
  description:
    "Back artists you believe in. Every pick is permanent, timestamped, and upgrades as they grow.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <StoreProvider>
          <Nav />
          <main>{children}</main>
          <footer className="mt-24 border-t border-line py-8 text-center text-xs text-faint">
            Track Record — early prototype. All artists and numbers on this build are placeholder
            data.
          </footer>
        </StoreProvider>
      </body>
    </html>
  );
}
