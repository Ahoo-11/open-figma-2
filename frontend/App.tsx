import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ProjectList } from "./components/ProjectList";
import { DesignEditor } from "./components/DesignEditor";
import { Header } from "./components/Header";
import LandingPage from "./components/LandingPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-semibold">Page not found</h2>
        <p className="text-neutral-500">The page you are looking for does not exist.</p>
        <Link to="/" className="text-primary-600 hover:underline">Go to Home</Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <Router>
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<ProjectList />} />
              <Route path="/design/:designId" element={<DesignEditor />} />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Toaster />
        </Router>
      </div>
    </QueryClientProvider>
  );
}
