import type { ReactNode } from 'react';

export default function ProjectDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  // This layout can be expanded later if project-specific headers or sidebars are needed
  // that are outside the main AppShell but specific to the /projects/[id] route segment.
  // For now, it just renders children, letting AppShell handle global layout.
  return <>{children}</>;
}
