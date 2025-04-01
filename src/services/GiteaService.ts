import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { supabase as clientSupabase } from '@/providers/supabase-provider';

/**
 * Gitea OAuth2 服务类
 * 处理 Gitea 的 OAuth2 认证流程
 */
export class GiteaService {
  private static instance: GiteaService;
  private clientId: string;
  private clientSecret: string;
  private giteaUrl: string;
  private redirectUri: string;
  private appUrl: string;
  private supabase: SupabaseClient | null = null;
  private isServerSide: boolean;

  private constructor() {
    this.clientId = process.env.NEXT_PUBLIC_GITEA_CLIENT_ID || '';
    this.clientSecret = process.env.NEXT_PUBLIC_GITEA_CLIENT_SECRET || '';
    this.giteaUrl = process.env.NEXT_PUBLIC_GITEA_URL || '';
    this.appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    this.redirectUri = '';
    this.isServerSide = typeof window === 'undefined';
  }

  /**
   * 获取 GiteaService 单例
   */
  public static getInstance(): GiteaService {
    if (!GiteaService.instance) {
      GiteaService.instance = new GiteaService();
    }
    return GiteaService.instance;
  }

  /**
   * 设置 Supabase 客户端
   * 在服务器端使用时需要调用此方法
   */
  public setSupabaseClient(supabaseClient: SupabaseClient): void {
    this.supabase = supabaseClient;
  }

  /**
   * 获取 Supabase 客户端
   * 自动判断是客户端还是服务器端环境
   */
  private getSupabaseClient(): SupabaseClient {
    if (this.supabase) {
      return this.supabase;
    }

    if (this.isServerSide) {
      // 服务器端环境，创建新的 Supabase 客户端
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
      return createClient(supabaseUrl, supabaseKey);
    } else {
      // 客户端环境，使用现有的 Supabase 客户端
      return clientSupabase;
    }
  }

  /**
   * 设置重定向 URI
   * @param uri 重定向 URI
   */
  public setRedirectUri(uri: string): void {
    this.redirectUri = uri;
  }

  /**
   * 获取应用 URL
   * 如果设置了环境变量 NEXT_PUBLIC_APP_URL，则使用它
   * 否则尝试使用浏览器的 location.origin
   */
  public getAppUrl(): string {
    if (this.appUrl) {
      return this.appUrl;
    }
    
    if (!this.isServerSide && typeof window !== 'undefined') {
      return window.location.origin;
    }
    
    return '';
  }

  /**
   * 获取 Gitea OAuth2 授权 URL
   * @returns 授权 URL
   */
  public getAuthorizationUrl(): string {
    // 如果没有显式设置重定向 URI，则使用默认值
    const redirectUri = this.redirectUri || `${this.getAppUrl()}/auth/gitea-callback`;
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'read:user,user:email'
    });

    return `${this.giteaUrl}/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * 使用授权码获取访问令牌
   * @param code 授权码
   * @returns 访问令牌和用户信息
   */
  public async getAccessToken(code: string): Promise<{ 
    access_token: string; 
    user: any;
  }> {
    // 如果没有显式设置重定向 URI，则使用默认值
    const redirectUri = this.redirectUri || `${this.getAppUrl()}/auth/gitea-callback`;
    
    const tokenUrl = `${this.giteaUrl}/login/oauth/access_token`;
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data = await response.json();
    const accessToken = data.access_token;

    // 获取用户信息
    const user = await this.getUserInfo(accessToken);

    return {
      access_token: accessToken,
      user
    };
  }

  /**
   * 获取用户信息
   * @param accessToken 访问令牌
   * @returns 用户信息
   */
  public async getUserInfo(accessToken: string): Promise<any> {
    const userUrl = `${this.giteaUrl}/api/v1/user`;
    const response = await fetch(userUrl, {
      headers: {
        'Authorization': `token ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 使用 Gitea 用户信息创建或更新 Supabase 用户
   * @param giteaUser Gitea 用户信息
   * @param accessToken Gitea 访问令牌
   * @returns Supabase 用户会话
   */
  public async signInWithGiteaUser(giteaUser: any, accessToken: string): Promise<any> {
    const supabase = this.getSupabaseClient();
    
    // 检查用户是否已存在
    const { data: existingUser, error: searchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('gitea_id', giteaUser.id.toString())
      .maybeSingle();

    if (searchError) {
      console.error('Error searching for existing user:', searchError);
    }

    if (existingUser) {
      // 用户已存在，更新信息
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          username: giteaUser.login,
          avatar_url: giteaUser.avatar_url,
          gitea_token: accessToken,
          updated_at: new Date().toISOString()
        })
        .eq('gitea_id', giteaUser.id.toString())
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user profile:', updateError);
        throw updateError;
      }

      // 获取对应的 auth.users 记录
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Error getting auth user:', authError);
        throw authError;
      }

      return authUser;
    } else {
      // 创建新用户
      // 1. 创建 auth.users 记录
      const email = giteaUser.email || `${giteaUser.login}@gitea.user`;
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: crypto.randomUUID(), // 生成随机密码
        options: {
          data: {
            gitea_id: giteaUser.id.toString(),
            gitea_token: accessToken,
            gitea_login: giteaUser.login,
            name: giteaUser.full_name || giteaUser.login,
            avatar_url: giteaUser.avatar_url
          }
        }
      });

      if (signUpError) {
        console.error('Error signing up new user:', signUpError);
        throw signUpError;
      }

      return authData;
    }
  }
}

// 导出单例实例
export default GiteaService;
