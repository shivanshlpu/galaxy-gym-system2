import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import queryClient from './lib/queryClient';
import AppRouter from './router';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1C1C28',
            color: '#F1F1F5',
            border: '1px solid #2A2A3D',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#22C55E', secondary: '#1C1C28' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#1C1C28' },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
