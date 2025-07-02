import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LocationInputProps {
  onLocationSearch: (location: string) => void;
  currentLocation: string;
}

interface Suggestion {
  description: string;
  place_id?: string;
}

export const LocationInput = ({ onLocationSearch, currentLocation }: LocationInputProps) => {
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Your deployed backend URL for autocomplete
  const AUTOCOMPLETE_API = import.meta.env.VITE_BACKEND_URL;

  // Fetch autocomplete suggestions when searchValue changes
  useEffect(() => {
    if (searchValue.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        const response = await fetch(`${AUTOCOMPLETE_API}/api/autocomplete?input=${encodeURIComponent(searchValue)}`);
        if (!response.ok) throw new Error('Failed to fetch suggestions');
        const data = await response.json();

        // Google Places Autocomplete returns predictions array
        setSuggestions(data.predictions || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error(err);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    // Debounce the API call by 300ms
    const debounceId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceId);
  }, [searchValue]);

  // Handle suggestion click
  const handleSuggestionClick = (description: string) => {
    setSearchValue(description);
    setSuggestions([]);
    setShowSuggestions(false);
    onLocationSearch(description);
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onLocationSearch(searchValue);
      setShowSuggestions(false);
    }
  };

  // Close suggestions if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="mb-12" ref={containerRef}>
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-700/50 relative overflow-visible">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5 pointer-events-none rounded-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center mb-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-200/30 dark:border-green-700/30">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mr-3 shadow-lg">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-sm text-muted-foreground block">Current Location</span>
              <span className="font-bold text-foreground text-lg">{currentLocation}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-4 relative">
            <div className="flex-1 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-6 h-6 z-10" />
                <Input
                  type="text"
                  placeholder="Enter city, address, or landmark..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  className="pl-14 h-16 text-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2 border-transparent focus:border-purple-500 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-20 left-0 right-0 max-h-64 overflow-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-b-2xl shadow-xl text-left text-sm text-gray-900 dark:text-gray-100 mt-1">
                  {suggestions.map((sugg, idx) => (
                    <li
                      key={sugg.place_id || idx}
                      className="px-4 py-2 cursor-pointer hover:bg-purple-600 hover:text-white transition-colors"
                      onClick={() => handleSuggestionClick(sugg.description)}
                    >
                      {sugg.description}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button
              type="submit"
              className="h-16 px-8 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white font-bold text-lg rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 border-0 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Zap className="w-6 h-6 mr-2 relative z-10" />
              <span className="relative z-10">Search</span>
            </Button>
          </form>

          {loadingSuggestions && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-600 dark:text-gray-300 z-30">
              Loading...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
