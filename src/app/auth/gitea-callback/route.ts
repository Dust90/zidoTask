import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import GiteaService from '@/services/GiteaService';
import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const searchParams = requestUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const next = searchParams.get('next') || '/';
  
  // 使用环境变量中的应用 URL，如果不存在则使用请求 URL 的 origin
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;
  
  console.log('Gitea auth params:', {
    hasCode: !!code,
    hasError: !!error,
    errorDescription,
    next,
    appUrl
  });

  try {
    // 如果有错误，直接抛出
    if (error) {
      throw new Error(errorDescription || 'Gitea authentication failed');
    }

    // 如果没有授权码，重定向到登录页
    if (!code) {
      console.log('No Gitea auth code provided');
      return NextResponse.redirect(new URL('/login', appUrl));
    }

    // 创建 Supabase 客户端
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // 创建带有 service role key 的 Supabase 客户端，用于管理操作
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // 获取 Gitea 服务实例
    const giteaService = GiteaService.getInstance();
    giteaService.setRedirectUri(`${appUrl}/auth/gitea-callback`);
    
    // 设置服务器端 Supabase 客户端
    giteaService.setSupabaseClient(supabase);

    // 使用授权码获取访问令牌和用户信息
    console.log('Exchanging code for Gitea access token...');
    const { access_token, user: giteaUser } = await giteaService.getAccessToken(code);
    
    console.log('Gitea user info:', {
      id: giteaUser.id,
      login: giteaUser.login,
      email: giteaUser.email
    });

    // 生成一个固定长度的密码（使用 Gitea ID 和一个固定的盐值）
    const generatePassword = (giteaId: string) => {
      const salt = 'gitea-auth-salt-value';
      return createHash('sha256')
        .update(`${giteaId}-${salt}`)
        .digest('hex')
        .substring(0, 32); // 使用 32 个字符的密码
    };
    
    const password = generatePassword(giteaUser.id.toString());

    // 尝试使用邮箱和生成的密码登录
    if (giteaUser.email) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: giteaUser.email,
        password: password
      });
      
      if (!signInError && signInData.user) {
        console.log('Found existing user with email:', signInData.user.id);
        
        // 更新用户元数据，添加或更新 Gitea 信息
        await supabase.auth.updateUser({
          data: {
            gitea_id: giteaUser.id.toString(),
            gitea_token: access_token,
            gitea_login: giteaUser.login,
            avatar_url: giteaUser.avatar_url || signInData.user.user_metadata?.avatar_url,
            name: giteaUser.full_name || giteaUser.login || signInData.user.user_metadata?.name,
            last_login: new Date().toISOString()
          }
        });
        
        console.log('Existing user signed in and updated with Gitea info');
        return NextResponse.redirect(new URL(next, appUrl));
      }
    }
    
    // 没有找到现有用户，创建新用户
    console.log('Creating new user with Gitea');
    const email = giteaUser.email || `${giteaUser.login}@gitea.user`;
    
    // 使用 admin API 创建用户
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: giteaUser.full_name || giteaUser.login,
        username: giteaUser.login,
        avatar_url: giteaUser.avatar_url,
        gitea_id: giteaUser.id.toString(),
        gitea_token: access_token,
        gitea_login: giteaUser.login,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        auth_provider: 'gitea'
      }
    });
    
    if (createUserError) {
      console.error('Error creating user:', createUserError);
      throw createUserError;
    }
    
    if (!newUser?.user) {
      throw new Error('Failed to create user');
    }
    
    console.log('New user created:', newUser.user.id);
    
    // 登录新创建的用户
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (signInError) {
      console.error('Error signing in new user:', signInError);
      throw signInError;
    }
    
    console.log('New user signed in successfully');
    return NextResponse.redirect(new URL(next, appUrl));
  } catch (error) {
    console.error('Gitea auth callback error:', error);
    // 重定向到登录页面并显示错误
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Gitea 登录失败，请重试')}`, appUrl)
    );
  }
}
