// Route-group layout for the admin panel + auth screen. Importing theme.css here
// (and nowhere else) keeps Tailwind + the design tokens scoped to /admin and
// /auth — the public marketing site never loads them. This is a nested layout,
// so it does NOT render <html>/<body> (the root layout owns those).
import "./theme.css";
import Providers from "./providers";

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Providers>{children}</Providers>;
}
