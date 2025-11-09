import PageWrapper from '@/components/page-wrapper';

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageWrapper>{children}</PageWrapper>;
}