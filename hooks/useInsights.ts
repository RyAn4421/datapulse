import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 30000
};

export function useInsights(datasetId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(datasetId ? `/api/insights/${datasetId}` : null, fetcher, swrConfig);

  return {
    insights: data,
    isLoading,
    isError: error,
    mutate
  };
}
