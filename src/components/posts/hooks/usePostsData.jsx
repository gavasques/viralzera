import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { toast } from "sonner";
import { COLUMNS } from "../constants";

export const QUERY_KEYS = {
  posts: (focusId) => ['posts', focusId],
  audiences: (focusId) => ['audiences', focusId],
  postTypes: (focusId) => ['postTypes', focusId],
  columns: (focusId) => ['kanbanColumns', focusId],
};

export function useKanbanColumns(focusId) {
  return useQuery({
    queryKey: QUERY_KEYS.columns(focusId),
    queryFn: () => neon.entities.KanbanColumn.filter({ focus_id: focusId }),
    enabled: !!focusId,
    staleTime: 60000,
  });
}

export function useInitializeColumns(focusId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const defaults = COLUMNS.map((col, index) => ({
        focus_id: focusId,
        title: col.title,
        slug: col.id,
        order: index,
        color: col.color,
        icon_name: col.icon?.displayName || 'Circle' // Simplified, assumes icons have names or map them
      }));
      // Using bulkCreate or sequential
      for (const col of defaults) {
        await neon.entities.KanbanColumn.create(col);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.columns(focusId) });
    }
  });
}

export function useCreateColumn(focusId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => neon.entities.KanbanColumn.create({ ...data, focus_id: focusId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.columns(focusId) });
      toast.success('Coluna criada!');
    }
  });
}

export function useUpdateColumn(focusId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => neon.entities.KanbanColumn.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.columns(focusId) });
    }
  });
}

export function useDeleteColumn(focusId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => neon.entities.KanbanColumn.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.columns(focusId) });
      toast.success('Coluna removida!');
    }
  });
}

export function usePosts(focusId) {
  return useQuery({
    queryKey: QUERY_KEYS.posts(focusId),
    queryFn: () => neon.entities.Post.filter({ focus_id: focusId }),
    enabled: !!focusId,
    staleTime: 30000,
  });
}

export function useAudiences(focusId) {
  return useQuery({
    queryKey: QUERY_KEYS.audiences(focusId),
    queryFn: () => neon.entities.Audience.filter({ focus_id: focusId }),
    enabled: !!focusId,
    staleTime: 60000,
  });
}

export function usePostTypes(focusId) {
  return useQuery({
    queryKey: QUERY_KEYS.postTypes(focusId),
    queryFn: () => neon.entities.PostType.filter({ focus_id: focusId }),
    enabled: !!focusId,
    staleTime: 60000,
  });
}

export function useUpdatePostStatus(focusId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) => neon.entities.Post.update(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.posts(focusId) });
      
      const previousPosts = queryClient.getQueryData(QUERY_KEYS.posts(focusId));
      
      queryClient.setQueryData(QUERY_KEYS.posts(focusId), (old) =>
        old?.map(post => post.id === id ? { ...post, status } : post)
      );
      
      return { previousPosts };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(QUERY_KEYS.posts(focusId), context.previousPosts);
      toast.error('Erro ao mover postagem');
    },
    onSuccess: (_, { status }) => {
      const column = COLUMNS.find(c => c.id === status);
      toast.success(`Movido para "${column?.title}"`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts(focusId) });
    }
  });
}

export function useSavePost(focusId, onSuccess) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => {
      if (id) {
        return neon.entities.Post.update(id, data);
      }
      return neon.entities.Post.create({ ...data, focus_id: focusId });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts(focusId) });
      toast.success(id ? 'Postagem atualizada!' : 'Postagem criada!');
      onSuccess?.();
    },
    onError: (err) => toast.error(err.message)
  });
}

export function useDeletePost(focusId, onSuccess) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => neon.entities.Post.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts(focusId) });
      toast.success('Postagem excluída!');
      onSuccess?.();
    },
    onError: (err) => toast.error(err.message)
  });
}