import React from "react";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  // Return the auth page content without the MainLayout so the main header is not rendered.
  return <>{children}</>;
}
