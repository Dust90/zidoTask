import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '设置 - Zido',
  description: '管理你的账号设置和偏好',
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
