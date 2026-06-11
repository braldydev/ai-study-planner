import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

import {
  ClerkProvider,
  SignInButton,
} from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "AI Study Planner",
  description: "AI-powered study planner",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          userButtonAvatarBox: "cursor-pointer",
          userButtonTrigger: "cursor-pointer",
        },
      }}
    >
      <html lang="en">
        <body>
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}