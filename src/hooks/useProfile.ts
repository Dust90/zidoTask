import { useState, useEffect } from 'react';
import { supabase } from '@/providers/supabase-provider';
import { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileFormData {
  username: string;
  password: string;
  confirmPassword: string;
}

export function useProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载用户资料
  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 获取当前用户
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }
      
      if (!currentUser) {
        setUser(null);
        setProfile(null);
        return;
      }

      setUser(currentUser);

      // 获取用户资料
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select()
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!profileData && !profileError) {
        // 如果没有找到资料，创建一个新的
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: currentUser.id,
            username: currentUser.email?.split('@')[0] || null
          })
          .select()
          .single();

        if (createError) {
          if (createError.code === '23505') { // 如果是主键冲突，说明资料已存在，重试获取
            const { data: retryData, error: retryError } = await supabase
              .from('profiles')
              .select()
              .eq('id', currentUser.id)
              .single();
            
            if (!retryError && retryData) {
              setProfile(retryData);
              return;
            }
          }
          throw createError;
        }

        if (newProfile) {
          setProfile(newProfile);
          return;
        }
      } else if (profileError) {
        throw profileError;
      } else if (profileData) {
        setProfile(profileData);
      }
    } catch (err) {
      console.error('Load profile error:', err);
      const message = err instanceof Error ? err.message : '加载用户资料失败';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // 更新用户资料
  const updateProfile = async (formData: Partial<ProfileFormData>) => {
    if (!user) throw new Error('未登录');

    try {
      setError(null);

      // 如果提供了新密码
      if (formData.password) {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('两次输入的密码不一致');
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.password
        });

        if (passwordError) throw passwordError;
      }

      // 更新用户资料
      if (formData.username) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ username: formData.username })
          .eq('id', user.id);

        if (profileError) throw profileError;

        setProfile(prev => prev ? { ...prev, username: formData.username! } : null);
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新用户资料失败';
      setError(message);
      return false;
    }
  };

  // 更新头像
  const updateAvatar = async (file: File) => {
    if (!user) throw new Error('未登录');

    try {
      setError(null);

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      // 上传到 Storage
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      if (data) {
        // 获取公开访问 URL
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${data.path}`;

        // 更新用户资料
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);

        if (updateError) throw updateError;

        // 只更新头像 URL，不重新加载整个资料
        setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
        
        return publicUrl;
      }
      return null;
    } catch (err) {
      console.error('Update avatar error:', err);
      const message = err instanceof Error ? err.message : '更新头像失败';
      setError(message);
      return null;
    }
  };

  // 监听认证状态变化
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile();
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    // 初始加载
    loadProfile();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    profile,
    isLoading,
    error,
    updateProfile,
    updateAvatar,
    loadProfile,
  };
}
