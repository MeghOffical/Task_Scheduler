import PageWrapper from '@/components/page-wrapper';

export default function PomodoroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageWrapper>{children}</PageWrapper>;
}