'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EmailTemplatesRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the actual email templates page
    router.replace('/dashboard/email/templates');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-senova-primary"></div>
    </div>
  );
}