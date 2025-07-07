
import { MapPin, Sparkles } from 'lucide-react';

export const LocationHeader = () => {
  return (
    <div className="text-center mb-12 relative">
      <div className="flex items-center justify-center mb-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
        <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-4 rounded-2xl shadow-2xl">
          <MapPin className="w-10 h-10 text-white" />
        </div>
        <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-bounce" />
      </div>
      
      <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-6 drop-shadow-lg">
        Nearest Location Finder
      </h1>
      
      <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
        Discover amazing places around you with our intelligent location finder. 
        <span className="text-purple-600 dark:text-purple-400 font-semibold"> Find bus stations, railways, airports, hotels, restaurants, and accommodations</span> within minutes.
      </p>
      
      <div className="mt-8 flex justify-center space-x-2">
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-100"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
      </div>
    </div>
  );
};
