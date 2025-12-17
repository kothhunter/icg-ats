import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import type { Config } from '@/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ICG Application Tracking System',
  description: 'Apply to join Irvine Consulting Group - a student-run organization at UC Irvine dedicated to developing future business leaders.',
};

async function getConfig(): Promise<Config | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured');
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data, error } = await supabase
      .from('config')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching config:', error);
      return null;
    }

    return data as Config;
  } catch (error) {
    console.error('Failed to fetch config:', error);
    return null;
  }
}

export default async function Home() {
  const config = await getConfig();

  const cycleName = config?.cycle_name || 'Current Cycle';
  const applicationsOpen = config?.applications_open ?? true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-icg-light via-white to-icg-lighter">
      {/* Officer Login Link - Top Right */}
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
        <Link
          href="/login"
          className="text-xs sm:text-sm text-icg-blue hover:text-icg-blue transition-colors font-medium underline"
        >
          Officer Login
        </Link>
      </div>

      {/* Main Content - Centered */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 py-12">
        <div className="text-center max-w-3xl w-full">
          {/* ICG Logo */}
          <div className="mb-6 sm:mb-8 flex justify-center">
            <Image
              src="/images/ICG default + name darkblue.png"
              alt="Irvine Consulting Group Logo"
              width={500}
              height={150}
              priority
              className="h-20 sm:h-28 md:h-32 w-auto"
            />
          </div>

          {/* Main Header */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-icg-blue mb-6 sm:mb-8 px-2">
            Application Tracking System
          </h2>

          {/* Cycle Name */}
          <div className="mb-8 sm:mb-12">
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-700 font-medium px-2">
              {cycleName}
            </p>
          </div>

          {/* Apply Button or Closed Message */}
          {applicationsOpen ? (
            <Link
              href="/apply"
              className="inline-block bg-icg-navy hover:bg-icg-blue text-white font-bold text-lg sm:text-xl md:text-2xl px-8 py-4 sm:px-12 sm:py-5 md:px-16 md:py-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              APPLY HERE
            </Link>
          ) : (
            <div>
              <button
                disabled
                className="inline-block bg-gray-400 text-white font-bold text-lg sm:text-xl md:text-2xl px-8 py-4 sm:px-12 sm:py-5 md:px-16 md:py-6 rounded-xl shadow-lg cursor-not-allowed opacity-60"
              >
                APPLY HERE
              </button>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-red-600 font-semibold px-2">
                Applications are currently closed
              </p>
            </div>
          )}

          {/* Info Text */}
          <div className="mt-8 sm:mt-12 text-gray-600 px-4 sm:px-2">
            <p className="text-sm sm:text-base md:text-lg leading-relaxed">
              Irvine Consulting Group is a student-run organization at UC Irvine
              dedicated to developing future business leaders through consulting projects
              and professional development opportunities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Revalidate every 60 seconds to check for config updates
export const revalidate = 60;
