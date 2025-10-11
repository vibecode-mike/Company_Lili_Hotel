/**
 * 會員管理 Hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memberService } from '../services/memberService';
import type { MemberSearchParams, MemberCreate, MemberUpdate } from '@/types/member';
import { message } from 'antd';

export const useMembers = (params: MemberSearchParams) => {
  return useQuery({
    queryKey: ['members', params],
    queryFn: () => memberService.getMembers(params),
  });
};

export const useMemberDetail = (id: number) => {
  return useQuery({
    queryKey: ['member', id],
    queryFn: () => memberService.getMemberById(id),
    enabled: !!id,
  });
};

export const useCreateMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MemberCreate) => memberService.createMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      message.success('會員創建成功');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '會員創建失敗');
    },
  });
};

export const useUpdateMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MemberUpdate }) =>
      memberService.updateMember(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member', variables.id] });
      message.success('會員更新成功');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '會員更新失敗');
    },
  });
};

export const useDeleteMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => memberService.deleteMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      message.success('會員刪除成功');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '會員刪除失敗');
    },
  });
};

export const useAddMemberTags = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, tag_ids }: { id: number; tag_ids: number[] }) =>
      memberService.addTags(id, tag_ids),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member', variables.id] });
      message.success('標籤添加成功');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '標籤添加失敗');
    },
  });
};

export const useRemoveMemberTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, tagId }: { id: number; tagId: number }) =>
      memberService.removeTag(id, tagId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member', variables.id] });
      message.success('標籤移除成功');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '標籤移除失敗');
    },
  });
};
