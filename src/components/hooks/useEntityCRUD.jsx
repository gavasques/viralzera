import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

/**
 * Custom hook for common CRUD operations on entities
 * Reduces boilerplate across pages
 * 
 * @param {string} entityName - Name of the entity (e.g., 'Audience', 'Persona')
 * @param {string} queryKey - React Query key for invalidation
 * @param {object} options - Additional options
 */
export function useEntityCRUD(entityName, queryKey, options = {}) {
  const queryClient = useQueryClient();
  const {
    onSaveSuccess,
    onDeleteSuccess,
    saveSuccessMessage = "Salvo com sucesso!",
    deleteSuccessMessage = "Removido com sucesso!",
    saveErrorMessage = "Erro ao salvar",
    deleteErrorMessage = "Erro ao remover"
  } = options;

  const entity = base44.entities[entityName];

  const saveMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      if (id) {
        return entity.update(id, data);
      }
      return entity.create(data);
    },
    onSuccess: () => {
      toast.success(saveSuccessMessage);
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      onSaveSuccess?.();
    },
    onError: (err) => toast.error(`${saveErrorMessage}: ${err.message}`)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entity.delete(id),
    onSuccess: () => {
      toast.success(deleteSuccessMessage);
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      onDeleteSuccess?.();
    },
    onError: (err) => toast.error(`${deleteErrorMessage}: ${err.message}`)
  });

  const save = (id, data) => saveMutation.mutate({ id, data });
  const create = (data) => saveMutation.mutate({ id: null, data });
  const update = (id, data) => saveMutation.mutate({ id, data });
  const remove = (id) => deleteMutation.mutate(id);

  return {
    save,
    create,
    update,
    remove,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    saveMutation,
    deleteMutation
  };
}