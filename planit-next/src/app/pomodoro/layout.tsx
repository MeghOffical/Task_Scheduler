import DashboardLayout from '@/components/dashboard-layout';

export default function PomodoroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}