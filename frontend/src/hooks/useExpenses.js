import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import * as expenseService from '../services/expenseService.js';

export const expenseKeys = {
  all: ['expenses'],
  list: (params) => ['expenses', 'list', params],
};

export function useExpenses(params = {}) {
  return useQuery({
    queryKey: expenseKeys.list(params),
    queryFn: ({ signal }) => expenseService.getExpenses(params, signal),
    select: (res) => ({
      expenses: res.data.expenses,
      total: res.data.total,
    }),
    staleTime: 30_000,
  });
}

export function useExpensesInfinite(params = {}) {
  return useInfiniteQuery({
    queryKey: [...expenseKeys.list(params), 'infinite'],
    queryFn: ({ pageParam = 0, signal }) =>
      expenseService.getExpenses({ ...params, limit: 20, offset: pageParam }, signal)
        .then(res => ({
          ...res.data,
          offset: pageParam,
          limit: 20,
        })),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;
      return lastPage.offset + lastPage.limit;
    },
    staleTime: 30_000,
  });
}

export function useAllExpenses() {
  return useQuery({
    queryKey: ['expenses', 'all'],
    queryFn: ({ signal }) => expenseService.getExpenses({}, signal),
    select: (res) => res.data.expenses,
    staleTime: 30_000,
  });
}

export function useExpensesSummary(params = {}) {
  return useQuery({
    queryKey: ['expenses', 'summary', params],
    queryFn: ({ signal }) => expenseService.getExpensesSummary(params, signal),
    select: (res) => ({
      categories: res.data.categories,
      total: res.data.total,
    }),
    staleTime: 30_000,
  });
}

export function useExpensesTrends(params = {}) {
  return useQuery({
    queryKey: ['expenses', 'trends', params],
    queryFn: ({ signal }) => expenseService.getExpensesTrends(params, signal),
    select: (res) => res.data,
    staleTime: 30_000,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => expenseService.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => expenseService.updateExpense(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => expenseService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
