import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as categoryService from '../services/categoryService.js';

export const categoryKeys = {
  all: ['categories'],
  list: () => ['categories', 'list'],
};

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: () => categoryService.getCategories(),
    select: (res) => res.data,
    staleTime: 30_000,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name) => categoryService.createCategory(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }) => categoryService.updateCategory(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => categoryService.deleteCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function findCategoryByName(categories, name) {
  return categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
}
