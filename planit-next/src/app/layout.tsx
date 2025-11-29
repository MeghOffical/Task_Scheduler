import "./globals.css";
import { Inter } from "next/font/google";
import AuthProvider from "@/components/auth-provider";
import { MusicPlayerProvider } from "@/components/music/MusicPlayerProvider";
import FloatingMusicBar from "@/components/music/FloatingMusicBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "PlanIt - Task Scheduler",
  description: "A comprehensive task management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased min-h-screen text-gray-900 dark:text-slate-50 bg-light-brand-gradient dark:bg-[#05070B]`}
      >
        <AuthProvider>
          <MusicPlayerProvider>
            {children}

            {/* Floating draggable music bar available on all pages */}
            <FloatingMusicBar />
          </MusicPlayerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}