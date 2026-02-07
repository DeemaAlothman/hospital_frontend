'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, fetchUser } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');

      // الصفحات العامة
      const publicPaths = ['/login'];
      const isPublicPath = publicPaths.includes(pathname);

      if (!token && !isPublicPath && pathname !== '/') {
        router.push('/login');
        return;
      }

      if (token && !isAuthenticated) {
        await fetchUser();
      }

      // إذا المستخدم مسجل دخول وفي صفحة login
      if (token && isAuthenticated && isPublicPath) {
        router.push('/dashboard');
      }
    };

    checkAuth();
  }, [pathname, isAuthenticated, fetchUser, router]);

  return <>{children}</>;
}
