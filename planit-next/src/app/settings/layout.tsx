import PageWrapper from '@/components/page-wrapper';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageWrapper>{children}</PageWrapper>;
}