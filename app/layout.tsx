import type { Metadata } from 'next';
import Image from 'next/image';
import './globals.css';

export const metadata: Metadata = {
  title: 'ICG-ATS | Application Tracking System',
  description: 'Irvine Consulting Group Application Tracking System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-icg-lighter">
        <header className="bg-icg-navy shadow-md">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Image
                  src="/images/ICG logo white.png"
                  alt="Irvine Consulting Group Logo"
                  width={180}
                  height={60}
                  priority
                  className="h-12 w-auto"
                />
                <div className="border-l border-gray-400 pl-4 h-12 flex flex-col justify-center">
                  <h1 className="text-white text-lg font-bold leading-tight">ATS</h1>
                  <p className="text-gray-300 text-xs">Application Tracking System</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="bg-icg-navy text-white mt-16">
          <div className="container mx-auto px-4 py-6 text-center">
            <p className="text-sm">© 2024 Irvine Consulting Group. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
