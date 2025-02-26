// lib/useAxiosSWR.ts
import axios, { AxiosError } from 'axios';
import useSWR, { KeyedMutator } from 'swr';

const axiosInstance = axios.create({
  baseURL: '/api/proxy/',
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
    const response = await axiosInstance.get(url);
    return response.data;
  });

  const isLoading = !data && !error && url !== null;
  return { data, error, mutate, isLoading };
}
