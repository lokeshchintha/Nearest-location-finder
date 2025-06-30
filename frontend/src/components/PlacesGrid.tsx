import React, { useState } from 'react';
import { PlaceCard } from './PlaceCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface Place {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  categoryIcon: string;
  text: string;
  distance: string; // km as string, e.g. "1.23"
  rating: string; // e.g. "4.5" or "N/A"
  address: string;
  lat: number;
  lng: number;
}

interface PlacesGridProps {
  places: Place[];
  userLocation: { lat: number; lng: number } | null;
}

export const PlacesGrid: React.FC<PlacesGridProps> = ({ places, userLocation }) => {
  const [loading, setLoading] = useState(false);

  const categories = ['bus_station', 'train_station', 'airport', 'lodging', 'restaurant'];

  const getCategoryGradient = (category: string) => {
    const gradients: Record<string, string> = {
      bus_station: 'from-blue-500 to-cyan-500',
      train_station: 'from-green-500 to-emerald-500',
      airport: 'from-purple-500 to-violet-500',
      lodging: 'from-orange-500 to-red-500',
      restaurant: 'from-pink-500 to-rose-500',
    };
    return gradients[category] || 'from-gray-500 to-gray-600';
  };

  // Deduplicate places by id
  const deduplicatePlaces = (placesArray: Place[]) => {
    const map = new Map<string, Place>();
    for (const place of placesArray) {
      if (!map.has(place.id)) {
        map.set(place.id, place);
      }
    }
    return Array.from(map.values());
  };

  const getCategoryPlaces = (category: string) =>
    deduplicatePlaces(places.filter((place) => place.category === category));

  if (loading) return <LoadingSpinner />;

  if (places.length === 0)
    return (
      <div className="text-center text-muted-foreground font-semibold my-8">
        No places found nearby.
      </div>
    );

  return (
    <div className="space-y-8">
      {categories.map((category) => {
        const categoryPlaces = getCategoryPlaces(category);

        if (categoryPlaces.length === 0) return null;

        return (
          <section
            key={category}
            aria-label={`${categoryPlaces[0]?.categoryName} Places`}
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/30 overflow-hidden relative group"
          >
            <div
              className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none rounded-3xl"
              style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
            />

            <div
              className={`bg-gradient-to-r ${getCategoryGradient(category)} px-8 py-6 relative overflow-hidden rounded-t-3xl`}
            >
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-t-3xl"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                  {categoryPlaces[0]?.categoryName}
                </h3>
                <p className="text-white/90 text-sm font-medium">
                  {categoryPlaces.length} amazing place{categoryPlaces.length > 1 ? 's' : ''} found
                </p>
              </div>

              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            </div>

            <div className="p-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryPlaces.map((place) => (
                  <PlaceCard key={place.id} place={place} userLocation={userLocation} />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
};
