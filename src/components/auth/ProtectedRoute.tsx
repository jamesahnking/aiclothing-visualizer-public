'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth');
    }
  }, [user, isLoading, router]);
  
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }
  
  if (!user) {
    return null;
  }
  
  return <>{children}</>;
}
