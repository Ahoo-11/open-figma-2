import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { Project } from "~backend/design/types";

interface SearchBarProps {
  onSearchResults: (projects: Project[]) => void;
  onClearSearch: () => void;
}

export function SearchBar({ onSearchResults, onClearSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (query.trim()) {
        performSearch();
      } else {
        onClearSearch();
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [query]);

  const performSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await backend.design.searchProjects({ query: query.trim() });
      onSearchResults(response.projects);
    } catch (error) {
      console.error("Search failed:", error);
      toast({
        title: "Error",
        description: "Search failed",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    onClearSearch();
  };

  return (
    <div className="relative max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        type="text"
        placeholder="Search projects..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10 pr-10"
      />
      {query && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      {isSearching && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
