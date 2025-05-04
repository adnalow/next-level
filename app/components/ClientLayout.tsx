'use client'
import { NavbarWrapper } from '@/components/ui/navbar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavbarWrapper />
      {children}
    </>
  );
}
