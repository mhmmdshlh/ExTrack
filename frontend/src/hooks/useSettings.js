import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as settingsService from '../services/settingsService.js';

export const settingsKeys = {
  all: ['settings'],
  single: () => ['settings', 'single'],
};

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.single(),
    queryFn: () => settingsService.getSettings(),
    select: (res) => res.data,
    staleTime: 30_000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => settingsService.updateSettings(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.all }),
  });
}
