import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 在顶层解析 URL，确保在整个函数范围内可用
  const requestUrl = new URL(request.url);
  const searchParams = requestUrl.searchParams;
  
  try {
    
    // 获取所有可能的认证参数
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const provider = searchParams.get('provider');
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    console.log('Auth params:', {
      hasCode: !!code,
      hasError: !!error,
      errorDescription,
      provider,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken
    });

    // 如果有错误，直接抛出
    if (error) {
      throw new Error(errorDescription || 'Authentication failed');
    }

    // 如果没有授权码，重定向到登录页
    if (!code) {
      console.log('No auth code provided, checking other auth methods...');
      
      // 尝试获取当前会话
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('Existing session found, redirecting to home');
        return NextResponse.redirect(new URL('/', requestUrl.origin));
      }
      
      console.log('No authentication method available');
      return NextResponse.redirect(new URL('/login', requestUrl.origin));
    }

    // 创建 Supabase 客户端
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // 交换授权码获取会话
    console.log('Exchanging code for session...');
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    console.log('Exchange result:', {
      success: !!data,
      error: exchangeError?.message,
      session: !!data?.session,
    });
    
    if (exchangeError) {
      throw exchangeError;
    }

    // 验证会话是否成功创建
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Final session state:', {
      exists: !!session,
      user: session?.user?.email,
      error: sessionError?.message,
    });

    if (session) {
      // 认证成功，重定向到主页
      console.log('Session created successfully, redirecting to home');
      return NextResponse.redirect(new URL('/', requestUrl.origin));
    }

    // 如果没有会话，重定向到登录页
    console.log('No valid session created');
    return NextResponse.redirect(new URL('/login', requestUrl.origin));
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/login', requestUrl.origin));
  }
}
