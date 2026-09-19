import type { Metadata } from "next";
import { DM_Sans, Newsreader } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { getCurrentUser } from "@/lib/queries";
import "./globals.css";

const serif = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-serif" });
const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "Between Lines", template: "%s · Between Lines" },
  description: "Poems, fragments, and things worth keeping.",
  icons: { icon: "/favicon.svg" },
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser().catch(() => null);
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <Navbar user={user ? { id: user.id, display_name: user.display_name } : null} />
        <main>{children}</main>
      </body>
    </html>
  );
}
