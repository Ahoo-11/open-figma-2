import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Layers, 
  Home, 
  FileText, 
  Bell, 
  Settings, 
  User, 
  ChevronDown,
  Search,
  Share2,
  HelpCircle,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const isDesignEditor = location.pathname.startsWith("/design/");

  const openNewDesign = () => {
    navigate("/dashboard", { state: { openAIDialog: true } });
  };

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 gradient-primary rounded-xl blur-sm opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 p-2 rounded-xl shadow-lg">
                <Layers className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                DesignStudio
              </h1>
              <span className="text-xs text-neutral-500 -mt-1">Professional Design Tool</span>
            </div>
          </Link>
          
          {!isDesignEditor && (
            <nav className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" asChild className="text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100">
                <Link to="/dashboard" className="flex items-center space-x-2">
                  <Home className="h-4 w-4" />
                  <span className="font-medium">Dashboard</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={openNewDesign} className="ml-1">
                <Sparkles className="h-4 w-4 mr-1" />
                New Design
              </Button>
            </nav>
          )}
        </div>

        {/* Center Section - Search (for design editor) */}
        {isDesignEditor && (
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search layers, components..."
                className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors text-sm"
              />
            </div>
          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {isDesignEditor && (
            <>
              <Button variant="ghost" size="sm" className="text-neutral-600 hover:text-neutral-900">
                <Share2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button size="sm" className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-200">
                <FileText className="h-4 w-4 mr-2" />
                Export
              </Button>
            </>
          )}

          {/* Help */}
          <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-neutral-700">
            <HelpCircle className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-neutral-700 relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary-500 rounded-full"></span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2 pl-2 pr-3">
                <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-sm">
                  <User className="h-4 w-4 text-white" />
                </div>
                <ChevronDown className="h-3 w-3 text-neutral-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-lg">
              <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
                <p className="text-sm font-medium">Design User</p>
                <p className="text-xs text-neutral-500">designer@studio.com</p>
              </div>
              <DropdownMenuItem className="flex items-center space-x-2 cursor-pointer">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center space-x-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center space-x-2 cursor-pointer text-red-600 hover:text-red-700">
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
