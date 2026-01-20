"use client"
import React from "react";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  // simple wrapper; expand later with context / tailwind/theme logic
  return <div data-theme="karkey">{children}</div>;
}
