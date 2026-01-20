// Remove any global footer for admin pages by not rendering it in the layout.
// To ensure the footer is not shown, you must conditionally render the footer in your root layout (app/layout.tsx).
// Example for app/layout.tsx:
//
// if (pathname.startsWith("/admin")) {
//   // Do not render <Footer />
// }
//
// This file only renders children, so no footer will appear for admin pages.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
