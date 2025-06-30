
import { useState, useEffect } from 'react';
import { LocationHeader } from '@/components/LocationHeader';
import { LocationInput } from '@/components/LocationInput';
import { PlacesGrid } from '@/components/PlacesGrid';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';

const Index = () => {
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState<[]>([]);
  const { toast } = useToast();

  console.log('User Location:', userLocation);

  // Get user's current location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setLocationName('Your current location');
          fetchNearbyPlaces(location);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLoading(false);
          toast({
            title: "Location Access Denied",
            description: "Please enter a location manually to find nearby places.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Geolocation Not Supported",
        description: "Please enter a location manually to find nearby places.",
        variant: "destructive",
      });
    }
  }, []);

  const placeTypes = [
  "airport",
  "airstrip",
  "bus_station",
  "bus_stop",
  "ferry_terminal",
  "heliport",
  "international_airport",
  "light_rail_station",
  "park_and_ride",
  "subway_station",
  "taxi_stand",
  "train_station",
  "transit_depot",
  "transit_station",
  "truck_stop",
  "cafe",
  "restaurant",
  "meal_delivery",
  "meal_takeaway",
  "lodging",
  "hotel",
  "motel",
  "hostel",
  "guest_house",
  "bed_and_breakfast",
  "resort_hotel"
];

function normalizeCategory(type: string): string {
  if (["airport", "airstrip", "heliport", "international_airport"].includes(type))
    return "airport";

  if (["bus_station", "bus_stop", "transit_depot", "transit_station", "park_and_ride"].includes(type))
    return "bus_station";

  if (["train_station", "subway_station", "light_rail_station"].includes(type))
    return "train_station";

  if (["taxi_stand"].includes(type))
    return "taxi_stand";

  if (["ferry_terminal"].includes(type))
    return "ferry_terminal";

  if (["truck_stop"].includes(type))
    return "truck_stop";

  if (["cafe"].includes(type))
    return "cafe";

  if (["restaurant", "meal_delivery", "meal_takeaway"].includes(type))
    return "restaurant";

  if (["lodging", "hotel", "motel", "hostel", "guest_house", "bed_and_breakfast", "resort_hotel"].includes(type))
    return "lodging";

  return "unknown";
}

  const API_URL = import.meta.env.REACT_APP_BACKEND_URL;


  const fetchNearbyPlaces = async (location) => {
  setLoading(true);
  try {
    const response = await fetch(`${API_URL}/api/nearby-places`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location, placeTypes }),
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`Server Error ${response.status}: ${text}`);
    }

    if (!text) {
      throw new Error('Empty response from server');
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Could not parse JSON:', text);
      throw new Error('Invalid JSON received');
    }

    setPlaces(data);
  } catch (error) {
    console.error('Frontend error:', error.message);
  } finally {
    setLoading(false);
  }
};





// Helper functions for category display names and icons:

const getCategoryName = (category: string) => {
  const map: Record<string, string> = {
    bus_station: 'Bus Stations',
    train_station: 'Railway Stations',
    airport: 'Airports',
    lodging: 'Hotels',
    restaurant: 'Restaurants',
  };
  return map[category] || category;
};

const getCategoryIcon = (category: string) => {
  const map: Record<string, string> = {
    bus_station: 'bus',
    train_station: 'map',
    airport: 'map-pin',
    lodging: 'hotel',
    restaurant: 'restaurant',
  };
  return map[category] || 'map-pin';
};

  const handleLocationSearch = async (searchLocation: string) => {
    if (!searchLocation.trim()) return;
    
    setLoading(true);
    try {
      // For now, use a mock location. In production, you'd use geocoding API
      const mockLocation = { lat: 40.7128, lng: -74.0060 }; // NYC coordinates
      setUserLocation(mockLocation);
      setLocationName(searchLocation);
      fetchNearbyPlaces(mockLocation);
    } catch (error) {
      console.error('Error searching location:', error);
      setLoading(false);
      toast({
        title: "Search Error",
        description: "Failed to find the location. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/30 relative overflow-hidden">
      {/* Animated background elements */}
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

export default Index;
