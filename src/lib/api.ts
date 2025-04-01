import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()

export interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in-progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  start_date?: string
  due_date?: string
  created_at?: string
  updated_at?: string
  cancelled_at?: string
  cancelled_reason?: string
  cancelled_by?: string
  tags: Array<{ id?: string, name: string, color?: string }>
  user_id: string
  username?: string
  avatar_url?: string
  project_id?: string
  assignee?: {
    id: string
    username: string
    avatar_url?: string
  }
}

export interface CreateTaskInput {
  title: string
  description?: string
  status: 'todo' | 'in-progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  start_date?: string
  due_date?: string
  tags: Array<{ name: string, color?: string }>
  project_id?: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  status?: 'todo' | 'in-progress' | 'completed' | 'cancelled'
  priority?: 'low' | 'medium' | 'high'
  due_date?: string
  tags?: Array<{ name: string, color?: string }>
  project_id?: string | null
}

export interface Tag {
  id: string
  name: string
  color?: string
  user_id: string
}

// 团队接口
export interface Team {
  id: string
  name: string
  description?: string
  avatar_url?: string
  owner_id: string
  created_at?: string
  updated_at?: string
}

export interface CreateTeamInput {
  name: string
  description?: string
  avatar_url?: string
}

export interface UpdateTeamInput {
  name?: string
  description?: string
  avatar_url?: string
}

// 项目接口
export interface Project {
  id: string
  name: string
  description?: string
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed'
  team_id: string
  created_at?: string
  updated_at?: string
  due_date?: string
  color?: string
  team?: {
    id: string
    name: string
    description?: string
    avatar_url?: string
  }
}

export interface CreateProjectInput {
  name: string
  description?: string
  team_id: string
  due_date?: string
  color?: string
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  status?: Project['status']
  due_date?: string
  color?: string
}

// 团队成员接口
export interface TeamMember {
  team_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'guest'
  joined_at?: string
  invited_by?: string
  username?: string
  avatar_url?: string
  email?: string
}

// 项目成员接口
export interface ProjectMember {
  project_id: string
  user_id: string
  role: 'manager' | 'admin' | 'member' | 'viewer'
  joined_at?: string
  username?: string
  avatar_url?: string
  email?: string
}

// 团队邀请接口
export interface TeamInvitation {
  id: string
  team_id: string
  email: string
  role: 'admin' | 'member' | 'guest'
  invited_by: string
  created_at?: string
  expires_at?: string
  token: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
}

export async function createTask(task: CreateTaskInput): Promise<Task> {
  try {
    // 格式化日期
    const { tags, ...taskData } = task
    const formattedTask = {
      ...taskData,
      start_date: task.start_date ? new Date(task.start_date).toISOString() : new Date().toISOString(),
      due_date: task.due_date ? new Date(task.due_date).toISOString() : null,
      status: task.status || 'todo',
      priority: task.priority || 'medium',
    }

    // 获取当前用户
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // 创建任务
    const { data: newTask, error: taskError } = await supabase
      .from('tasks')
      .insert({
        ...formattedTask,
        user_id: user.id
      })
      .select()
      .single()

    if (taskError) throw taskError

    let taskWithTags = newTask

    // 如果有标签
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        // 检查标签是否存在
        const { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tag.name)
          .eq('user_id', user.id)
          .single()

        let tagId
        
        if (existingTag) {
          // 使用现有标签
          tagId = existingTag.id
        } else {
          // 创建新标签
          const { data: newTag, error: newTagError } = await supabase
            .from('tags')
            .insert({
              name: tag.name,
              color: tag.color || '#cccccc', // 默认颜色
              user_id: user.id
            })
            .select('id')
            .single()
            
          if (newTagError) throw newTagError
          tagId = newTag.id
        }
        
        // 创建任务-标签关联
        const { error: linkError } = await supabase
          .from('task_tags')
          .insert({
            task_id: newTask.id,
            tag_id: tagId
          })
          
        if (linkError) throw linkError
      }

      // 获取完整的任务信息（包括标签）
      const { data: taskWithTagsData, error: tagsError } = await supabase
        .from('tasks')
        .select(`
          *,
          tags:task_tags(tag_id, tags:tags(id, name, color))
        `)
        .eq('id', newTask.id)
        .single()

      if (tagsError) throw tagsError

      // 转换标签格式以匹配 API 返回格式
      const formattedTags = taskWithTagsData.tags 
        ? taskWithTagsData.tags.map((tagRelation: any) => ({
            name: tagRelation.tags.name,
            color: tagRelation.tags.color
          }))
        : []

      taskWithTags = {
        ...taskWithTagsData,
        tags: formattedTags
      }
    }

    // 获取用户信息
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('Error fetching user profile:', userError)
      // 即使获取用户资料失败，我们仍然返回任务数据
      return taskWithTags
    }

    return {
      ...taskWithTags,
      username: userProfile.username,
      avatar_url: userProfile.avatar_url
    }
  } catch (error) {
    console.error('Error creating task:', error)
    throw error
  }
}

export async function updateTask(taskId: string, task: UpdateTaskInput): Promise<Task> {
  try {
    // 格式化日期
    const { tags, ...taskData } = task
    const formattedTask = {
      ...taskData,
      due_date: task.due_date ? new Date(task.due_date).toISOString() : null,
    }

    // 更新任务基本信息
    const { data: updatedTask, error: taskError } = await supabase
      .from('tasks')
      .update(formattedTask)
      .eq('id', taskId)
      .select()
      .single()

    if (taskError) throw taskError

    // 如果有标签更新
    if (tags) {
      // 删除旧的标签
      const { error: deleteError } = await supabase
        .from('task_tags')
        .delete()
        .eq('task_id', taskId)

      if (deleteError) throw deleteError

      // 添加新的标签
      if (tags.length > 0) {
        // 首先确保所有标签都存在
        for (const tag of tags) {
          // 检查标签是否存在
          const { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('name', tag.name)
            .eq('user_id', updatedTask.user_id)
            .single()

          let tagId
          
          if (existingTag) {
            // 使用现有标签
            tagId = existingTag.id
          } else {
            // 创建新标签
            const { data: newTag, error: newTagError } = await supabase
              .from('tags')
              .insert({
                name: tag.name,
                color: tag.color || '#cccccc', // 默认颜色
                user_id: updatedTask.user_id
              })
              .select('id')
              .single()
              
            if (newTagError) throw newTagError
            tagId = newTag.id
          }
          
          // 创建任务-标签关联
          const { error: linkError } = await supabase
            .from('task_tags')
            .insert({
              task_id: taskId,
              tag_id: tagId
            })
            
          if (linkError) throw linkError
        }
      }
    }

    // 获取完整的任务信息（包括标签）
    const { data: finalTask, error: finalError } = await supabase
      .from('tasks')
      .select(`
        *,
        tags:task_tags(tag_id, tags:tags(id, name, color))
      `)
      .eq('id', taskId)
      .single()

    if (finalError) throw finalError

    // 转换标签格式以匹配 API 返回格式
    const formattedTags = finalTask.tags 
      ? finalTask.tags.map((tagRelation: any) => ({
          name: tagRelation.tags.name,
          color: tagRelation.tags.color
        }))
      : []

    // 获取用户信息
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', finalTask.user_id)
      .single()

    if (userError) {
      console.error('Error fetching user profile:', userError)
      // 即使获取用户资料失败，我们仍然返回任务数据
      return {
        ...finalTask,
        tags: formattedTags
      }
    }

    return {
      ...finalTask,
      tags: formattedTags,
      username: userProfile.username,
      avatar_url: userProfile.avatar_url
    }
  } catch (error) {
    console.error('Error updating task:', error)
    throw error
  }
}

export async function getTasks(projectId?: string): Promise<Task[]> {
  try {
    // 首先获取基本任务数据
    let query = supabase
      .from('tasks')
      .select(`
        *,
        tags:task_tags(tag_id, tags:tags(id, name, color))
      `)
      .order('created_at', { ascending: false });
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: tasks, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // 转换标签格式以匹配 API 返回格式
    const tasksWithFormattedTags = tasks ? tasks.map(task => {
      const formattedTags = task.tags 
        ? task.tags.map((tagRelation: any) => ({
            id: tagRelation.tags.id,
            name: tagRelation.tags.name,
            color: tagRelation.tags.color
          }))
        : [];
      
      return {
        ...task,
        tags: formattedTags
      };
    }) : [];

    return tasksWithFormattedTags;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
}

export async function cancelTask(taskId: string, reason: string) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_reason: reason,
      cancelled_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function deleteTask(taskId: string) {
  try {
    // 首先删除任务与标签的关联
    const { error: deleteTagsError } = await supabase
      .from('task_tags')
      .delete()
      .eq('task_id', taskId)

    if (deleteTagsError) throw deleteTagsError

    // 然后删除任务
    const { error: deleteTaskError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (deleteTaskError) throw deleteTaskError

    return { success: true }
  } catch (error) {
    console.error('Error deleting task:', error)
    throw error
  }
}

// 团队相关API函数
export async function getTeams(): Promise<Team[]> {
  try {
    // 直接获取团队，不使用内部连接
    const { data, error } = await supabase
      .from('teams')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
}

export async function getTeamById(teamId: string): Promise<Team> {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching team:', error);
    throw error;
  }
}

export async function createTeam(team: CreateTeamInput): Promise<Team> {
  try {
    const { data, error } = await supabase
      .from('teams')
      .insert({
        name: team.name,
        description: team.description,
        avatar_url: team.avatar_url,
        owner_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating team:', error);
    throw error;
  }
}

export async function updateTeam(teamId: string, team: UpdateTeamInput): Promise<Team> {
  try {
    const { data, error } = await supabase
      .from('teams')
      .update({
        name: team.name,
        description: team.description,
        avatar_url: team.avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', teamId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating team:', error);
    throw error;
  }
}

export async function deleteTeam(teamId: string) {
  try {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting team:', error);
    throw error;
  }
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  try {
    // 首先获取团队成员
    const { data: teamMembers, error: teamMembersError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId);
    
    if (teamMembersError) {
      throw teamMembersError;
    }
    
    if (!teamMembers || teamMembers.length === 0) {
      return [];
    }
    
    // 获取成员的个人资料
    const userIds = teamMembers.map(member => member.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);
    
    if (profilesError) {
      throw profilesError;
    }
    
    // 获取当前用户的信息
    const { data } = await supabase.auth.getUser();
    const currentUser = data.user;
    
    // 合并数据
    interface ProfileData {
      id: string;
      username?: string;
      avatar_url?: string;
    }
    
    const profilesMap: Record<string, ProfileData> = (profiles || []).reduce((map: Record<string, ProfileData>, profile: ProfileData) => {
      map[profile.id] = profile;
      return map;
    }, {});
    
    // 格式化数据
    return (teamMembers || []).map(member => {
      // 如果是当前用户，使用当前用户的电子邮件
      const isCurrentUser = currentUser && member.user_id === currentUser.id;
      const email = isCurrentUser && currentUser ? currentUser.email : undefined;
      
      return {
        team_id: member.team_id,
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at,
        invited_by: member.invited_by,
        username: profilesMap[member.user_id]?.username,
        avatar_url: profilesMap[member.user_id]?.avatar_url,
        email
      };
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }
}

export async function addTeamMember(teamId: string, userId: string, role: TeamMember['role']) {
  try {
    const { error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role: role,
        invited_by: (await supabase.auth.getUser()).data.user?.id
      });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding team member:', error);
    throw error;
  }
}

export async function updateTeamMemberRole(teamId: string, userId: string, role: TeamMember['role']) {
  try {
    const { error } = await supabase
      .from('team_members')
      .update({ role })
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating team member role:', error);
    throw error;
  }
}

export async function removeTeamMember(teamId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing team member:', error);
    throw error;
  }
}

// 项目相关API函数
export async function getProjects(teamId?: string): Promise<Project[]> {
  try {
    // 首先获取用户ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // 先获取用户所在的项目ID
    const { data: projectMemberships, error: membershipError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id);
    
    if (membershipError) {
      throw membershipError;
    }
    
    if (!projectMemberships || projectMemberships.length === 0) {
      return [];
    }
    
    // 然后获取这些项目的详细信息
    const projectIds = projectMemberships.map(pm => pm.project_id);
    let query = supabase
      .from('projects')
      .select(`
        *,
        team:team_id (
          name
        )
      `)
      .in('id', projectIds);
    
    if (teamId) {
      query = query.eq('team_id', teamId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
}

export async function getProjectById(projectId: string): Promise<Project> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        team:team_id (
          name
        )
      `)
      .eq('id', projectId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching project:', error);
    throw error;
  }
}

export async function createProject(project: CreateProjectInput): Promise<Project> {
  try {
    // 首先创建项目
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: project.name,
        description: project.description,
        team_id: project.team_id,
        due_date: project.due_date,
        color: project.color
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 然后将创建者添加为项目经理
    const userId = (await supabase.auth.getUser()).data.user?.id;
    await supabase
      .from('project_members')
      .insert({
        project_id: data.id,
        user_id: userId,
        role: 'manager'
      });

    return data;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

export async function updateProject(projectId: string, project: UpdateProjectInput): Promise<Project> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update({
        name: project.name,
        description: project.description,
        status: project.status,
        due_date: project.due_date,
        color: project.color,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

export async function deleteProject(projectId: string) {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  try {
    // 首先获取项目成员
    const { data: projectMembers, error: projectMembersError } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', projectId);
    
    if (projectMembersError) {
      throw projectMembersError;
    }
    
    if (!projectMembers || projectMembers.length === 0) {
      return [];
    }
    
    // 获取成员的个人资料
    const userIds = projectMembers.map(member => member.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);
    
    if (profilesError) {
      throw profilesError;
    }
    
    // 获取当前用户的信息
    const { data } = await supabase.auth.getUser();
    const currentUser = data.user;
    
    // 合并数据
    interface ProfileData {
      id: string;
      username?: string;
      avatar_url?: string;
    }
    
    const profilesMap: Record<string, ProfileData> = (profiles || []).reduce((map: Record<string, ProfileData>, profile: ProfileData) => {
      map[profile.id] = profile;
      return map;
    }, {});
    
    // 格式化数据
    return (projectMembers || []).map(member => {
      // 如果是当前用户，使用当前用户的电子邮件
      const isCurrentUser = currentUser && member.user_id === currentUser.id;
      const email = isCurrentUser && currentUser ? currentUser.email : undefined;
      
      return {
        project_id: member.project_id,
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at,
        username: profilesMap[member.user_id]?.username,
        avatar_url: profilesMap[member.user_id]?.avatar_url,
        email
      };
    });
  } catch (error) {
    console.error('Error fetching project members:', error);
    throw error;
  }
}

export async function addProjectMember(projectId: string, userId: string, role: ProjectMember['role']) {
  try {
    const { error } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: userId,
        role: role
      });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding project member:', error);
    throw error;
  }
}

export async function updateProjectMemberRole(projectId: string, userId: string, role: ProjectMember['role']) {
  try {
    const { error } = await supabase
      .from('project_members')
      .update({ role })
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating project member role:', error);
    throw error;
  }
}

export async function removeProjectMember(projectId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing project member:', error);
    throw error;
  }
}

// 团队邀请相关API函数
export async function createTeamInvitation(teamId: string, email: string, role: TeamInvitation['role']): Promise<TeamInvitation> {
  try {
    // 生成唯一邀请令牌
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const { data, error } = await supabase
      .from('team_invitations')
      .insert({
        team_id: teamId,
        email: email,
        role: role,
        invited_by: (await supabase.auth.getUser()).data.user?.id,
        token: token
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating team invitation:', error);
    throw error;
  }
}

export async function getTeamInvitations(teamId: string): Promise<TeamInvitation[]> {
  try {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', teamId);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching team invitations:', error);
    throw error;
  }
}

export async function acceptTeamInvitation(token: string) {
  try {
    // 获取邀请信息
    const { data: invitation, error: invitationError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (invitationError || !invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // 获取当前用户
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // 添加用户到团队
    await addTeamMember(invitation.team_id, userId, invitation.role);

    // 更新邀请状态
    const { error: updateError } = await supabase
      .from('team_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    if (updateError) {
      throw updateError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error accepting team invitation:', error);
    throw error;
  }
}

export async function declineTeamInvitation(token: string) {
  try {
    const { error } = await supabase
      .from('team_invitations')
      .update({ status: 'declined' })
      .eq('token', token)
      .eq('status', 'pending');

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error declining team invitation:', error);
    throw error;
  }
}

// 更新任务API，支持项目关联
export async function updateTaskWithProject(taskId: string, task: UpdateTaskInput & { project_id?: string | null }): Promise<Task> {
  try {
    // 格式化日期
    const formattedTask = {
      ...task,
      due_date: task.due_date ? new Date(task.due_date).toISOString() : null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('tasks')
      .update(formattedTask)
      .eq('id', taskId)
      .select(`
        *,
        profiles:user_id (
          username,
          avatar_url
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    // 处理返回数据
    const taskWithUsername = {
      ...data,
      username: data.profiles?.username,
      avatar_url: data.profiles?.avatar_url,
      tags: data.tags || []
    };

    return taskWithUsername;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

export async function updateTaskStatus(taskId: string, status: Task['status']): Promise<Task> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', taskId)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
}
