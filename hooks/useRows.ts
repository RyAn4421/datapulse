import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UseRowsOptions {
    datasetId: string | null;
    page?: number;
    limit?: number;
    search?: string;
}

const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 30000
};

export function useRows({ datasetId, page = 1, limit = 25, search = '' }: UseRowsOptions) {
  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());
  if (search) queryParams.append('search', search);

  const url = datasetId ? `/api/datasets/${datasetId}/rows?${queryParams.toString()}` : null;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, swrConfig);

  return {
    rowsData: data,
    isLoading,
    isError: error,
    mutate
  };
}
