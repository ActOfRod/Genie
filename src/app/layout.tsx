import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

const sans={variable:""};const display={variable:""};

export const metadata: Metadata = {
  title: "Genie — household money",
  description: "A simple household money app for American Express and Genisys Credit Union.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
      </body>
    </html>
  );
}