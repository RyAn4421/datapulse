import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 30000
};

const EMPTY_ARRAY: any[] = [];

export function useDatasets() {
  const { data, error, isLoading, mutate } = useSWR('/api/datasets', fetcher, swrConfig);

  return {
    datasets: data || EMPTY_ARRAY,
    isLoading,
    isError: error,
    mutate
  };
}

export function useDataset(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/datasets/${id}` : null, fetcher, swrConfig);

  return {
    dataset: data,
    isLoading,
    isError: error,
    mutate
  };
}
