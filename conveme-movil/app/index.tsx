import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';

export default function IndexScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/(app)/dashboard" />;
  }
  return <Redirect href="/auth/login" />;
}
