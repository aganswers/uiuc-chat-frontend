import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  X, 
  User, 
  FileText, 
  Folder,
  Home,
  Settings,
  BarChart3,
  Mail,
  Calendar,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Command,
  Database,
  Clock,
  Hash,
  Globe,
  Zap,
  BookOpen,
  Users,
  Shield,
  Cpu,
  LucideIcon
} from 'lucide-react';

interface Agent {
  id: number;
  name: string;
  type: 'agent';
  icon: LucideIcon;
  status: string;
  description: string;
}

interface FileItem {
  id: number;
  name: string;
  type: 'file' | 'folder';
  icon: LucideIcon;
  size?: string;
  items?: number;
  modified: string;
  path: string;
}

interface NavItem {
  id: number;
  name: string;
  type: 'nav';
  icon: LucideIcon;
  path: string;
  badge: string | null;
}

interface LLMQuery {
  id: number | string;
  name: string;
  type: 'llm';
  icon: LucideIcon;
  category?: string;
  custom?: boolean;
}

type SearchResult = Agent | FileItem | NavItem | LLMQuery;

const SpotlightSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Sample data
  const agents: Agent[] = [
    { id: 1, name: 'Sales Assistant', type: 'agent', icon: User, status: 'active', description: 'Handles customer inquiries and sales' },
    { id: 2, name: 'Data Analyst', type: 'agent', icon: BarChart3, status: 'active', description: 'Analyzes trends and patterns' },
    { id: 3, name: 'Content Writer', type: 'agent', icon: FileText, status: 'idle', description: 'Creates marketing content' },
    { id: 4, name: 'Code Helper', type: 'agent', icon: Cpu, status: 'active', description: 'Assists with programming tasks' },
  ];

  const files: FileItem[] = [
    { id: 1, name: 'Q4 Report.pdf', type: 'file', icon: FileText, size: '2.4 MB', modified: '2 hours ago', path: '/documents/reports' },
    { id: 2, name: 'Customer Database.xlsx', type: 'file', icon: Database, size: '15 MB', modified: 'Yesterday', path: '/data' },
    { id: 3, name: 'Marketing Strategy', type: 'folder', icon: Folder, items: 24, modified: '3 days ago', path: '/marketing' },
    { id: 4, name: 'Project Roadmap.docx', type: 'file', icon: FileText, size: '450 KB', modified: 'Last week', path: '/projects' },
  ];

  const navigation: NavItem[] = [
    { id: 1, name: 'Dashboard', type: 'nav', icon: Home, path: '/dashboard', badge: null },
    { id: 2, name: 'Analytics', type: 'nav', icon: BarChart3, path: '/analytics', badge: 'New' },
    { id: 3, name: 'Messages', type: 'nav', icon: Mail, path: '/messages', badge: '5' },
    { id: 4, name: 'Calendar', type: 'nav', icon: Calendar, path: '/calendar', badge: null },
    { id: 5, name: 'Settings', type: 'nav', icon: Settings, path: '/settings', badge: null },
    { id: 6, name: 'Team', type: 'nav', icon: Users, path: '/team', badge: null },
    { id: 7, name: 'Security', type: 'nav', icon: Shield, path: '/security', badge: null },
  ];

  const llmQueries: LLMQuery[] = [
    { id: 1, name: 'Explain quantum computing', type: 'llm', icon: Sparkles, category: 'Technology' },
    { id: 2, name: 'Write a marketing email', type: 'llm', icon: Sparkles, category: 'Writing' },
    { id: 3, name: 'Analyze sales trends', type: 'llm', icon: Sparkles, category: 'Analysis' },
    { id: 4, name: 'Generate code snippet', type: 'llm', icon: Sparkles, category: 'Programming' },
  ];

  const recentSearches = [
    { query: 'Customer report', time: '5 min ago', icon: Clock },
    { query: 'Sales dashboard', time: '1 hour ago', icon: Clock },
    { query: 'Team meetings', time: '3 hours ago', icon: Clock },
  ];

  // Filter results based on query and category
  const filteredResults = useMemo(() => {
    const lowerQuery = query.toLowerCase();
    let results: SearchResult[] = [];

    if (selectedCategory === 'all' || selectedCategory === 'agents') {
      results = [...results, ...agents.filter(a => 
        a.name.toLowerCase().includes(lowerQuery) || 
        a.description.toLowerCase().includes(lowerQuery)
      )];
    }

    if (selectedCategory === 'all' || selectedCategory === 'files') {
      results = [...results, ...files.filter(f => 
        f.name.toLowerCase().includes(lowerQuery) ||
        f.path.toLowerCase().includes(lowerQuery)
      )];
    }

    if (selectedCategory === 'all' || selectedCategory === 'navigation') {
      results = [...results, ...navigation.filter(n => 
        n.name.toLowerCase().includes(lowerQuery) ||
        n.path.toLowerCase().includes(lowerQuery)
      )];
    }

    if (selectedCategory === 'all' || selectedCategory === 'llm') {
      if (query.length > 0) {
        results = [...results, {
          id: 'llm-custom',
          name: `Ask AI: "${query}"`,
          type: 'llm' as const,
          icon: Sparkles,
          custom: true
        }];
      }
      results = [...results, ...llmQueries.filter(q => 
        q.name.toLowerCase().includes(lowerQuery)
      )];
    }

    return results;
  }, [query, selectedCategory]);

  // Keyboard shortcuts and custom event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }

      // Close with Escape
      if (e.key === 'Escape') {
        setIsOpen(false);
      }

      // Navigate with arrows
      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, filteredResults.length - 1));
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
        }
        if (e.key === 'Enter' && filteredResults.length > 0) {
          e.preventDefault();
          const selectedItem = filteredResults[selectedIndex];
          if (selectedItem) {
            handleSelect(selectedItem);
          }
        }
      }
    };

    const handleOpenSpotlight = () => {
      setIsOpen(true);
    };

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('openSpotlight', handleOpenSpotlight);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('openSpotlight', handleOpenSpotlight);
    };
  }, [isOpen, selectedIndex, filteredResults]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults]);

  const handleSelect = (item: SearchResult) => {
    console.log('Selected:', item);
    setIsOpen(false);
    setQuery('');
  };

  const getCategoryIcon = (category: string): LucideIcon => {
    switch(category) {
      case 'agents': return User;
      case 'files': return Database;
      case 'navigation': return Hash;
      case 'llm': return Sparkles;
      default: return Globe;
    }
  };

  const categories = [
    { id: 'all', name: 'All', icon: Globe },
    { id: 'agents', name: 'Agents', icon: User },
    { id: 'files', name: 'Files', icon: Database },
    { id: 'navigation', name: 'Navigation', icon: Hash },
    { id: 'llm', name: 'AI Query', icon: Sparkles },
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-51 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setIsOpen(false)}
      />
      
      <div className="flex min-h-full items-start justify-center p-4 pt-20">
        <div className="relative w-full max-w-3xl transform transition-all duration-300 scale-100 opacity-100">
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Search Header */}
            <div className="border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-4 p-5">
                <Search className="w-6 h-6 text-gray-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search agents, files, navigate, or ask AI..."
                  className="flex-1 text-lg bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Categories */}
              <div className="flex items-center gap-2 px-5 pb-4">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results */}
            <div ref={resultsRef} className="max-h-[400px] overflow-y-auto">
              {query.length === 0 && (
                <div className="p-5">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Recent Searches</div>
                  {recentSearches.map((search, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                    >
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="flex-1 text-gray-700 dark:text-gray-300">{search.query}</span>
                      <span className="text-xs text-gray-400">{search.time}</span>
                    </div>
                  ))}
                </div>
              )}

              {query.length > 0 && filteredResults.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No results found for "{query}"
                </div>
              )}

              {filteredResults.length > 0 && (
                <div className="p-2">
                  {filteredResults.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all ${
                          idx === selectedIndex
                            ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${
                          item.type === 'agent' ? 'bg-purple-100 dark:bg-purple-900/30' :
                          item.type === 'file' ? 'bg-green-100 dark:bg-green-900/30' :
                          item.type === 'nav' ? 'bg-blue-100 dark:bg-blue-900/30' :
                          'bg-amber-100 dark:bg-amber-900/30'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            item.type === 'agent' ? 'text-purple-600 dark:text-purple-400' :
                            item.type === 'file' ? 'text-green-600 dark:text-green-400' :
                            item.type === 'nav' ? 'text-blue-600 dark:text-blue-400' :
                            'text-amber-600 dark:text-amber-400'
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {item.name}
                            </span>
                            {'status' in item && item.status && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                item.status === 'active' 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                              }`}>
                                {item.status}
                              </span>
                            )}
                            {'badge' in item && item.badge && (
                              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {item.type === 'agent' && item.description}
                            {item.type === 'nav' && item.path}
                            {item.type === 'llm' && item.category}
                            {item.type === 'file' && `${item.size} • ${item.modified}`}
                            {item.type === 'folder' && `${item.items} items • ${item.modified}`}
                          </div>
                        </div>

                        {idx === selectedIndex && (
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>Open</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-800 px-5 py-3 flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↵</kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">esc</kbd>
                  Close
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3" />
                <span>AI-powered search</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotlightSearch;