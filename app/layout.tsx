import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

import {
  ClerkProvider,
  SignInButton,
} from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "StudyNovaAI - AI Study Planner",
  description:
    "Generate AI-powered study plans, quizzes and flashcards instantly.",
    keywords: [
  "AI study planner",
  "study planner",
  "AI flashcards",
  "AI quiz generator",
  "study app",
  "student AI tool",
],
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