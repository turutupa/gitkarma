import axios, { AxiosError } from 'axios';
import useSWR, { KeyedMutator } from 'swr';

// Helper function to create a delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useApiInstance = axios.create({
  baseURL: '/api/proxy',
  // You can also set headers or other options here
});

type TResponse<T> = {
  data: T;
  error: AxiosError;
  isLoading: boolean;
  mutate: KeyedMutator<any>;
};

export function useAPI<T>(url: string | null): TResponse<T> {
  const { data, error, mutate } = useSWR(url, async (url) => {
    // Only add delay in development
    if (process.env.NODE_ENV === 'development') {
      await delay(500);
    }
    const response = await useApiInstance.get(url);
    return response.data;
  });

  const isLoading = !data && !error && url !== null;
  return { data, error, mutate, isLoading };
}
