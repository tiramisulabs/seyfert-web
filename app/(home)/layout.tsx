import type { ReactNode } from 'react';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/app/layout.config';
import Navbar from '@/components/ui/navbar/nav';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

export default function Layout({ children }: { children: ReactNode }) {
  return <HomeLayout {...baseOptions} nav={{
    enabled: true,
    component: <Navbar />

  }} className={`${poppins.className} py-0`} >{children}</HomeLayout>;
}
