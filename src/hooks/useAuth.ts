import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/providers/supabase-provider';
import { User } from '@supabase/supabase-js';
import GiteaService from '@/services/GiteaService';

/**
 * Hook for managing user authentication.
 *
 * @returns {object} An object containing the user, loading state, and authentication functions.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          // 存储用户ID到localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('userId', session.user.id);
          }
        } else {
          setUser(null);
          // 清除localStorage中的用户ID
          if (typeof window !== 'undefined') {
            localStorage.removeItem('userId');
          }
        }
        setLoading(false);
      }
    );

    // 初始化时检查会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        // 存储用户ID到localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('userId', session.user.id);
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Signs out the current user.
   */
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      // 清除localStorage中的用户ID
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userId');
      }
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [router]);

  /**
   * Signs in with Google.
   */
  const signInWithGoogle = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
          skipBrowserRedirect: false, // 让 Supabase 处理重定向
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }, []);

  /**
   * Signs in with Gitea.
   */
  const signInWithGitea = useCallback(async () => {
    try {
      const giteaService = GiteaService.getInstance();
      giteaService.setRedirectUri(`${window.location.origin}/auth/gitea-callback`);
      
      // 获取授权 URL 并重定向
      const authUrl = giteaService.getAuthorizationUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error signing in with Gitea:', error);
      throw error;
    }
  }, []);

  /**
   * Signs in with password.
   *
   * @param {string} email - The user's email.
   * @param {string} password - The user's password.
   */
  const signInWithPassword = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        router.push('/');
      }
      return { data, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { data: null, error };
    }
  }, [router]);

  /**
   * Signs up a new user.
   *
   * @param {string} email - The user's email.
   * @param {string} password - The user's password.
   */
  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { data: null, error };
    }
  }, []);

  /**
   * Resets the user's password.
   *
   * @param {string} email - The user's email.
   */
  const resetPassword = useCallback(async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { data: null, error };
    }
  }, []);

  return {
    user,
    loading,
    signOut,
    signInWithGoogle,
    signInWithGitea,
    signInWithPassword,
    signUp,
    resetPassword,
  };
}
