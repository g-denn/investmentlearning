import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';

type RuntimeConfig = typeof globalThis & {
  __VIC_API_BASE_URL__?: string;
};

const runtimeConfig = globalThis as RuntimeConfig;
if (import.meta.env.VITE_API_BASE_URL) {
  runtimeConfig.__VIC_API_BASE_URL__ = import.meta.env.VITE_API_BASE_URL;
}

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 300000, // 5 minutes
    },
  },
});

// Get the root element
const rootElement = document.getElementById('root');

// Check if the element exists
if (!rootElement) {
  throw new Error('Root element not found. Make sure there is a div with id "root" in your HTML.');
}

// Create root and render app
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider>
          <App />
        </ChakraProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
