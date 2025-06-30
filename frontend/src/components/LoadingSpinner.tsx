
import { MapPin, Sparkles } from 'lucide-react';

export const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative mb-8">
        {/* Outer rotating ring */}
        <div className="animate-spin rounded-full h-24 w-24 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 p-1">
          <div className="bg-background rounded-full h-full w-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-1">
              <div className="bg-background rounded-full h-full w-full flex items-center justify-center">
                <MapPin className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating sparkles */}
        <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-bounce" />
        <Sparkles className="absolute -bottom-2 -left-2 w-4 h-4 text-pink-400 animate-bounce delay-500" />
        <Sparkles className="absolute top-1/2 -left-6 w-3 h-3 text-blue-400 animate-bounce delay-1000" />
      </div>
      
      <div className="text-center">
        <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">
          Finding Amazing Places...
        </p>
        <p className="text-muted-foreground font-medium">
          Discovering the best spots near you
        </p>
        
        {/* Loading dots */}
        <div className="flex justify-center space-x-2 mt-6">
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce delay-100"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-200"></div>
        </div>
      </div>
    </div>
  );
};
