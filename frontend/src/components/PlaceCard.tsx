import React, { useState } from 'react';
import { MapPin, Map, Bus, Hotel, Plane, Train } from 'lucide-react';
import { UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Place {
  id: string;
  name: string;
  category: string;
  categoryIcon: string;
  text: string;
  distance: string;
  rating: string;
  address: string;
  lat: number;
  lng: number;
}

interface PlaceDetails {
  photos?: string[];
  phoneNumber?: string;
  website?: string;
  description?: string;
}

interface PlaceCardProps {
  place: Place;
  userLocation: { lat: number; lng: number } | null;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ place, userLocation }) => {
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'bus':
        return Bus;
      case 'map':
        return Map;
      case 'train_station':
        return Train;
      case 'map-pin':
        return Plane;
      case 'hotel':
        return Hotel;
      case 'restaurant':
        return UtensilsCrossed;
      default:
        return MapPin;
    }
  };

  const getIconGradient = (category: string) => {
    const gradients: Record<string, string> = {
      bus_station: 'from-blue-500 to-cyan-500',
      train_station: 'from-green-500 to-emerald-500',
      airport: 'from-purple-500 to-violet-500',
      lodging: 'from-orange-500 to-red-500',
      restaurant: 'from-pink-500 to-rose-500',
      accommodation: 'from-indigo-500 to-blue-500',
    };
    return gradients[category] || 'from-gray-500 to-gray-600';
  };

  const IconComponent = getIconComponent(place.categoryIcon);

  

  const handleOpenInMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      tabIndex={0}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 dark:border-gray-700/30 hover:shadow-2xl transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-800/90 group hover:-translate-y-2 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-purple-500"
    >
      {/* Gradient overlay on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${getIconGradient(
          place.category
        )} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`}
      ></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div
              className={`p-3 bg-gradient-to-br ${getIconGradient(
                place.category
              )} rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}
            >
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-lg leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {place.name}
              </h4>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-sm font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
                  {place.distance} km
                </span>
                <span className="text-sm text-yellow-600 dark:text-yellow-400 font-bold bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full">
                  ⭐ {place.rating}
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
          {place.address}
        </p>

        {/* Show extra details or loading state */}
        {loadingDetails && (
          <p className="text-sm text-muted-foreground mb-2">Loading details...</p>
        )}
        {errorDetails && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-2">{errorDetails}</p>
        )}
        {details && (
          <>
            {details.phoneNumber && (
              <p className="text-sm mb-1">
                📞 <a href={`tel:${details.phoneNumber}`} className="underline">{details.phoneNumber}</a>
              </p>
            )}
            {details.website && (
              <p className="text-sm mb-2">
                🌐 <a href={details.website} target="_blank" rel="noopener noreferrer" className="underline">
                  Website
                </a>
              </p>
            )}
            {details.description && (
              <p className="text-sm mb-4">{details.description}</p>
            )}
          </>
        )}

        <Button
          onClick={handleOpenInMaps}
          aria-label={`Open ${place.name} in Google Maps`}
          className={`w-full h-12 text-sm bg-gradient-to-r ${getIconGradient(
            place.category
          )} border-0 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden group`}
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <Map className="w-4 h-4 mr-2 relative z-10" />
          <span className="relative z-10">Open in Maps</span>
        </Button>
      </div>
    </div>
  );
};
