import DashboardLayout from '@/components/dashboard-layout';

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
