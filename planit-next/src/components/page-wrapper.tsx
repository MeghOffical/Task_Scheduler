'use client';

import DashboardLayout from '@/components/dashboard-layout';
import GridBackground from '@/components/grid-background';

interface PageWrapperProps {
  children: React.ReactNode;
  useDashboardLayout?: boolean;
}

export default function PageWrapper({ children, useDashboardLayout = true }: PageWrapperProps) {
  const content = (
    <GridBackground>
      {children}
    </GridBackground>
  );

  if (useDashboardLayout) {
    return (
      <DashboardLayout>
        {content}
      </DashboardLayout>
    );
  }

  return content;
}