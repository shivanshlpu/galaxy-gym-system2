import { QueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        const message = error.response?.data?.error || 'Something went wrong';
        toast.error(message);
      },
    },
  },
});

export default queryClient;
