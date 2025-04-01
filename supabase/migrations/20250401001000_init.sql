-- Supabase 数据库初始化脚本
-- 版本: 1.0.0
-- 日期: 2025-04-01

-- 1. 创建必要的扩展
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- 2. 创建表结构（按依赖顺序）
-- 2.1 团队表
CREATE TABLE public.teams (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL CHECK (length(name) BETWEEN 3 AND 50),
    description text,
    avatar_url text,
    owner_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT teams_pkey PRIMARY KEY (id)
);

-- 2.2 用户个人资料表
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    username text NOT NULL CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$'),
    avatar_url text,
    email_notifications boolean DEFAULT true,
    theme text DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) 
        REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2.3 团队成员表
CREATE TABLE public.team_members (
    team_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL DEFAULT 'member' 
        CHECK (role IN ('owner', 'admin', 'member', 'guest')),
    joined_at timestamptz NOT NULL DEFAULT now(),
    invited_by uuid,
    CONSTRAINT team_members_pkey PRIMARY KEY (team_id, user_id),
    CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id)
        REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT team_members_invited_by_fkey FOREIGN KEY (invited_by)
        REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2.4 团队邀请表
CREATE TABLE public.team_invitations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    team_id uuid NOT NULL,
    email text NOT NULL,
    role text NOT NULL DEFAULT 'member' 
        CHECK (role IN ('admin', 'member', 'guest')),
    invited_by uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL DEFAULT (now() + '7 days'::interval),
    token text NOT NULL,
    status text NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    CONSTRAINT team_invitations_pkey PRIMARY KEY (id),
    CONSTRAINT team_invitations_token_key UNIQUE (token),
    CONSTRAINT team_invitations_team_id_fkey FOREIGN KEY (team_id)
        REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT team_invitations_invited_by_fkey FOREIGN KEY (invited_by)
        REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2.5 项目表
CREATE TABLE public.projects (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL CHECK (length(name) BETWEEN 3 AND 50),
    description text,
    status text NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'completed', 'archived')),
    team_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    due_date timestamptz,
    color text DEFAULT '#6366F1' CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
    CONSTRAINT projects_pkey PRIMARY KEY (id),
    CONSTRAINT projects_team_id_fkey FOREIGN KEY (team_id)
        REFERENCES teams(id) ON DELETE CASCADE
);

-- 2.6 项目成员表
CREATE TABLE public.project_members (
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL DEFAULT 'member' 
        CHECK (role IN ('manager', 'member', 'viewer')),
    joined_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT project_members_pkey PRIMARY KEY (project_id, user_id),
    CONSTRAINT project_members_project_id_fkey FOREIGN KEY (project_id)
        REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT project_members_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2.7 任务表
CREATE TABLE public.tasks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    title text NOT NULL CHECK (length(title) BETWEEN 1 AND 100),
    description text,
    status text NOT NULL 
        CHECK (status IN ('todo', 'in-progress', 'completed', 'cancelled')),
    priority text NOT NULL 
        CHECK (priority IN ('low', 'medium', 'high')),
    start_date timestamptz,
    due_date timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    user_id uuid NOT NULL,
    cancelled_at timestamptz,
    cancelled_reason text,
    cancelled_by uuid,
    deleted_at timestamptz,
    project_id uuid,
    CONSTRAINT tasks_pkey PRIMARY KEY (id),
    CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT tasks_cancelled_by_fkey FOREIGN KEY (cancelled_by)
        REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id)
        REFERENCES projects(id) ON DELETE SET NULL
);

-- 2.8 标签表
CREATE TABLE public.tags (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL CHECK (length(name) BETWEEN 1 AND 50),
    color text CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
    user_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT tags_pkey PRIMARY KEY (id),
    CONSTRAINT tags_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT tags_name_user_id_key UNIQUE (name, user_id)
);

-- 2.9 任务标签关联表
CREATE TABLE public.task_tags (
    task_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    CONSTRAINT task_tags_pkey PRIMARY KEY (task_id, tag_id),
    CONSTRAINT task_tags_task_id_fkey FOREIGN KEY (task_id)
        REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT task_tags_tag_id_fkey FOREIGN KEY (tag_id)
        REFERENCES tags(id) ON DELETE CASCADE
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON public.tasks (project_id);
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON public.tasks (user_id);
CREATE INDEX IF NOT EXISTS projects_team_id_idx ON public.projects (team_id);

-- 4. 行级安全策略(RLS)
-- 4.1 启用RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;

-- 4.2 个人资料策略
CREATE POLICY "用户个人资料访问" ON public.profiles
    FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- 4.3 团队策略
CREATE POLICY "团队管理" ON public.teams
    FOR ALL USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = teams.id
            AND team_members.user_id = auth.uid()
            AND team_members.role IN ('owner', 'admin')
        )
    );

-- 4.4 团队成员策略
CREATE POLICY "团队成员管理" ON public.team_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM teams
            WHERE teams.id = team_members.team_id
            AND (teams.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM team_members tm
                    WHERE tm.team_id = team_members.team_id
                    AND tm.user_id = auth.uid()
                    AND tm.role IN ('owner', 'admin')
                )
            )
        )
    );

-- 4.5 标签策略
CREATE POLICY "用户管理自己的标签" ON public.tags FOR ALL USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

-- 4.6 任务标签关联策略
CREATE POLICY "通过关联控制访问权限" ON public.task_tags FOR ALL USING (((EXISTS ( SELECT 1
   FROM tasks
  WHERE ((tasks.id = task_tags.task_id) AND (tasks.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM tags
  WHERE ((tags.id = task_tags.tag_id) AND (tags.user_id = auth.uid()))))));

-- 4.7 任务策略
CREATE POLICY "用户可以查看所有任务" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "用户只能创建自己的任务" ON public.tasks FOR INSERT WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "用户只能修改自己的任务" ON public.tasks FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "用户只能删除自己的任务" ON public.tasks FOR DELETE USING ((user_id = auth.uid()));

-- 4.8 个人资料访问策略
CREATE POLICY "用户可以查看所有个人资料" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "用户只能修改自己的个人资料" ON public.profiles FOR UPDATE USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));
CREATE POLICY "用户只能插入自己的个人资料" ON public.profiles FOR INSERT WITH CHECK ((id = auth.uid()));
CREATE POLICY "用户只能删除自己的个人资料" ON public.profiles FOR DELETE USING ((id = auth.uid()));

-- 4.9 团队策略
CREATE POLICY "用户可以创建团队" ON public.teams FOR INSERT WITH CHECK ((owner_id = auth.uid()));
CREATE POLICY "团队所有者和管理员可以更新团队" ON public.teams FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM team_members
  WHERE ((team_members.team_id = teams.id) AND (team_members.user_id = auth.uid()) AND (team_members.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));
CREATE POLICY "团队所有者可以删除团队" ON public.teams FOR DELETE USING ((owner_id = auth.uid()));

-- 4.10 项目策略
CREATE POLICY "团队成员可以创建项目" ON public.projects FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM team_members
  WHERE ((team_members.team_id = projects.team_id) AND (team_members.user_id = auth.uid()) AND (team_members.role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text]))))));
CREATE POLICY "项目经理和团队管理员可以更新项目" ON public.projects FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM project_members
  WHERE ((project_members.project_id = projects.id) AND (project_members.user_id = auth.uid()) AND (project_members.role = 'manager'::text)))) OR (EXISTS ( SELECT 1
   FROM team_members
  WHERE ((team_members.team_id = projects.team_id) AND (team_members.user_id = auth.uid()) AND (team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])))))));
CREATE POLICY "项目经理和团队管理员可以删除项目" ON public.projects FOR DELETE USING (((EXISTS ( SELECT 1
   FROM project_members
  WHERE ((project_members.project_id = projects.id) AND (project_members.user_id = auth.uid()) AND (project_members.role = 'manager'::text)))) OR (EXISTS ( SELECT 1
   FROM team_members
  WHERE ((team_members.team_id = projects.team_id) AND (team_members.user_id = auth.uid()) AND (team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])))))));

-- 4.11 项目成员策略
CREATE POLICY "项目经理和团队管理员可以添加项目成员" ON public.project_members FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM project_members project_members_1
  WHERE ((project_members_1.project_id = project_members.project_id) AND (project_members_1.user_id = auth.uid()) AND (project_members_1.role = 'manager'::text)))) OR (EXISTS ( SELECT 1
   FROM (projects p
     JOIN team_members tm ON ((p.team_id = tm.team_id)))
  WHERE ((p.id = project_members.project_id) AND (tm.user_id = auth.uid()) AND (tm.role = ANY (ARRAY['owner'::text, 'admin'::text])))))));
CREATE POLICY "项目经理和团队管理员可以更新项目成员角色" ON public.project_members FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM project_members project_members_1
  WHERE ((project_members_1.project_id = project_members_1.project_id) AND (project_members_1.user_id = auth.uid()) AND (project_members_1.role = 'manager'::text)))) OR (EXISTS ( SELECT 1
   FROM (projects p
     JOIN team_members tm ON ((p.team_id = tm.team_id)))
  WHERE ((p.id = project_members.project_id) AND (tm.user_id = auth.uid()) AND (tm.role = ANY (ARRAY['owner'::text, 'admin'::text])))))));
CREATE POLICY "项目经理和团队管理员可以移除项目成员" ON public.project_members FOR DELETE USING (((EXISTS ( SELECT 1
   FROM project_members project_members_1
  WHERE ((project_members_1.project_id = project_members_1.project_id) AND (project_members_1.user_id = auth.uid()) AND (project_members_1.role = 'manager'::text)))) OR (EXISTS ( SELECT 1
   FROM (projects p
     JOIN team_members tm ON ((p.team_id = tm.team_id)))
  WHERE ((p.id = project_members.project_id) AND (tm.user_id = auth.uid()) AND (tm.role = ANY (ARRAY['owner'::text, 'admin'::text])))))));

-- 4.12 团队邀请策略
CREATE POLICY "用户可以查看自己发出的邀请" ON public.team_invitations FOR SELECT USING ((invited_by = auth.uid()));
CREATE POLICY "团队管理员可以查看团队邀请" ON public.team_invitations FOR SELECT USING ((EXISTS ( SELECT 1
   FROM team_members
  WHERE ((team_members.team_id = team_invitations.team_id) AND (team_members.user_id = auth.uid()) AND (team_members.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));
CREATE POLICY "团队管理员可以创建邀请" ON public.team_invitations FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM team_members
  WHERE ((team_members.team_id = team_invitations.team_id) AND (team_members.user_id = auth.uid()) AND (team_members.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));
CREATE POLICY "团队管理员可以更新邀请状态" ON public.team_invitations FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM team_members
  WHERE ((team_members.team_id = team_invitations.team_id) AND (team_members.user_id = auth.uid()) AND (team_members.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));
CREATE POLICY "团队管理员可以删除邀请" ON public.team_invitations FOR DELETE USING ((EXISTS ( SELECT 1
   FROM team_members
  WHERE ((team_members.team_id = team_invitations.team_id) AND (team_members.user_id = auth.uid()) AND (team_members.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));

-- 4.13 项目任务策略
CREATE POLICY "用户可以查看自己所属项目的任务" ON public.tasks FOR SELECT USING (((user_id = auth.uid()) OR ((project_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM project_members
  WHERE ((project_members.project_id = tasks.project_id) AND (project_members.user_id = auth.uid())))))));
CREATE POLICY "用户可以创建任务到自己所属的项目" ON public.tasks FOR INSERT WITH CHECK (((user_id = auth.uid()) OR ((project_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM project_members
  WHERE ((project_members.project_id = tasks.project_id) AND (project_members.user_id = auth.uid())))))));
CREATE POLICY "用户可以更新自己所属项目的任务" ON public.tasks FOR UPDATE USING (((user_id = auth.uid()) OR ((project_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM project_members
  WHERE ((project_members.project_id = tasks.project_id) AND (project_members.user_id = auth.uid())))))));
CREATE POLICY "用户可以删除自己所属项目的任务" ON public.tasks FOR DELETE USING (((user_id = auth.uid()) OR ((project_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM project_members
  WHERE ((project_members.project_id = tasks.project_id) AND (project_members.user_id = auth.uid()) AND (project_members.role = 'manager'::text)))))));

-- 4.14 项目查看策略
CREATE POLICY "用户可以查看自己所属团队的项目" ON public.projects FOR SELECT USING ((team_id IN ( SELECT tm.team_id
   FROM team_members tm
  WHERE (tm.user_id = auth.uid()))));

-- 4.15 团队和项目成员查看策略
CREATE POLICY "所有认证用户可以查看团队成员" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "认证用户可以查看所有团队" ON public.teams FOR SELECT USING (true);
CREATE POLICY "认证用户可以查看所有项目成员" ON public.project_members FOR SELECT USING (true);

-- 4.16 存储桶策略
-- 创建存储桶
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('files', 'files', false);

-- 设置存储桶策略
CREATE POLICY "头像公开访问" ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "认证用户可以上传头像" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "用户可以更新自己的头像" ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND owner = auth.uid());

CREATE POLICY "用户可以删除自己的头像" ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND owner = auth.uid());

CREATE POLICY "认证用户可以查看文件" ON storage.objects FOR SELECT
USING (bucket_id = 'files' AND auth.role() = 'authenticated');

CREATE POLICY "认证用户可以上传文件" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'files' AND auth.role() = 'authenticated');

CREATE POLICY "用户可以更新自己的文件" ON storage.objects FOR UPDATE
USING (bucket_id = 'files' AND owner = auth.uid());

CREATE POLICY "用户可以删除自己的文件" ON storage.objects FOR DELETE
USING (bucket_id = 'files' AND owner = auth.uid());

-- 5. 创建触发器
-- 5.1 更新时间戳函数
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5.2 为所有表添加更新时间戳触发器
CREATE TRIGGER update_profiles_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_teams_timestamp
BEFORE UPDATE ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_projects_timestamp
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_tasks_timestamp
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- 6. 用户注册处理函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username)
    VALUES (
        NEW.id,
        COALESCE(
            NULLIF(NEW.raw_user_meta_data->>'name', ''),
            NULLIF(NEW.raw_user_meta_data->>'preferred_username', ''),
            SPLIT_PART(NEW.email, '@', 1)
        )
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 创建用户注册触发器
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. 设置权限
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 9. 刷新Supabase元数据
NOTIFY pgrst, 'reload schema';