import AppShell from '@/components/layout/AppShell';
import SedeGuard from '@/components/layout/SedeGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <SedeGuard>{children}</SedeGuard>
    </AppShell>
  );
}
