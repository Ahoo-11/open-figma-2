import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ProjectList } from "./components/ProjectList";
import { DesignEditor } from "./components/DesignEditor";
import { Header } from "./components/Header";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Router>
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<ProjectList />} />
              <Route path="/design/:designId" element={<DesignEditor />} />
            </Routes>
          </main>
          <Toaster />
        </Router>
      </div>
    </QueryClientProvider>
  );
}
