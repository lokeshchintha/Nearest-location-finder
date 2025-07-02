import { useState, useEffect } from 'react';
import { LocationHeader } from '@/components/LocationHeader';
import { LocationInput } from '@/components/LocationInput';
import { PlacesGrid } from '@/components/PlacesGrid';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Coordinates {
  lat: number;
  lng: number;
}

interface Place {
  id: string;
  name: string;
  type: string;
  location: Coordinates;
  [key: string]: any; // To support any additional data
}

const placeTypes = [
  "airport", "airstrip", "bus_station", "bus_stop", "ferry_terminal", "heliport", "international_airport",
  "light_rail_station", "park_and_ride", "subway_station", "taxi_stand", "train_station", "transit_depot",
  "transit_station", "truck_stop", "cafe", "restaurant", "meal_delivery", "meal_takeaway", "lodging",
  "hotel", "motel", "hostel", "guest_house", "bed_and_breakfast", "resort_hotel"
];

const normalizeCategory = (type: string): string => {
  const mapping: Record<string, string[]> = {
    airport: ["airport", "airstrip", "heliport", "international_airport"],
    bus_station: ["bus_station", "bus_stop", "transit_depot", "transit_station", "park_and_ride"],
    train_station: ["train_station", "subway_station", "light_rail_station"],
    taxi_stand: ["taxi_stand"],
    ferry_terminal: ["ferry_terminal"],
    truck_stop: ["truck_stop"],
    cafe: ["cafe"],
    restaurant: ["restaurant", "meal_delivery", "meal_takeaway"],
    lodging: ["lodging", "hotel", "motel", "hostel", "guest_house", "bed_and_breakfast", "resort_hotel"],
  };

  for (const [category, types] of Object.entries(mapping)) {
    if (types.includes(type)) return category;
  }
  return "unknown";
};

const getCategoryName = (category: string) => ({
  bus_station: 'Bus Stations',
  train_station: 'Railway Stations',
  airport: 'Airports',
  lodging: 'Hotels',
  restaurant: 'Restaurants',
}[category] || category);

const getCategoryIcon = (category: string) => ({
  bus_station: 'bus',
  train_station: 'map',
  airport: 'map-pin',
  lodging: 'hotel',
  restaurant: 'restaurant',
}[category] || 'map-pin');

const API_URL = import.meta.env.VITE_BACKEND_URL;

const HomePage = () => {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationName, setLocationName] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const { toast } = useToast();

  // Initial location fetch
  useEffect(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Please enter a location manually.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(loc);
        setLocationName("Your current location");
        fetchNearbyPlaces(loc);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "Location Access Denied",
          description: "Please enter a location manually.",
          variant: "destructive",
        });
        setLoading(false);
      }
    );
  }, []);

  const fetchNearbyPlaces = async (location: Coordinates) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/nearby-places`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, placeTypes }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server Error ${res.status}: ${text}`);
      }

      const text = await res.text();
      if (!text) throw new Error('Empty response from server');

      const data: Place[] = JSON.parse(text);
      setPlaces(data);
    } catch (err) {
      const error = err as Error;
      console.error('Frontend error:', error.message);
      toast({
        title: "Failed to fetch nearby places",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSearch = async (searchLocation: string) => {
    if (!searchLocation.trim()) return;

    setLoading(true);
    try {
      const mockLocation = { lat: 40.7128, lng: -74.0060 }; // Replace with real geocoding in production
      setUserLocation(mockLocation);
      setLocationName(searchLocation);
      fetchNearbyPlaces(mockLocation);
    } catch (err) {
      console.error('Search Error:', err);
      toast({
        title: "Search Error",
        description: "Failed to find the location. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/30 relative overflow-hidden">
      
      {/* Gradient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>

        <LocationHeader />

        <div className="max-w-4xl mx-auto">
          <LocationInput
            onLocationSearch={handleLocationSearch}
            currentLocation={locationName}
          />

          {loading && <LoadingSpinner />}
          {!loading && places.length > 0 && (
            <PlacesGrid places={places} userLocation={userLocation} />
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
