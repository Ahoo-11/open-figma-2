import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Figma, Home, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const location = useLocation();
  const isDesignEditor = location.pathname.startsWith("/design/");

  return (
    <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2">
            <Figma className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">OpenFigma</h1>
          </Link>
          
          {!isDesignEditor && (
            <nav className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/" className="flex items-center space-x-1">
                  <Home className="h-4 w-4" />
                  <span>Projects</span>
                </Link>
              </Button>
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {isDesignEditor && (
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-1" />
              Export
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
