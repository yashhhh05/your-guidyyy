import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lets Learn",
  description: "Your Personalized Tutor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} antialiased`}>
        <ClerkProvider appearance={{variables: {colorPrimary :"#fe5933"}}}>
        <Navbar/> {/* It means Navbar is common for all pages */}
        {children}  {/* children shows perticular what that page has ex sign in */}
        </ClerkProvider>
      </body>
    </html>
  );
}
