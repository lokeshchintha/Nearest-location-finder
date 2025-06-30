import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

app.post('/api/nearby-places', async (req, res) => {
  const { location, placeTypes } = req.body;
  const allPlaces = [];

  if (!location || !placeTypes || !Array.isArray(placeTypes)) {
    return res.status(400).json({ error: 'Missing or invalid input data' });
  }

  try {
    for (const type of placeTypes) {
      const response = await fetch('https://google-map-places-new-v2.p.rapidapi.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'x-rapidapi-key': process.env.MAPS_KEY,
          'x-rapidapi-host': 'google-map-places-new-v2.p.rapidapi.com',
          'Content-Type': 'application/json',
          'X-Goog-FieldMask': '*',
        },
        body: JSON.stringify({
          languageCode: 'en',
          regionCode: 'IN',
          rankPreference: 0,
          locationRestriction: {
            circle: {
              center: {
                latitude: location.lat,
                longitude: location.lng,
              },
              radius: 50000,
            },
          },
          maxResultCount: 10,
          includedTypes: [type],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      const placesArray = data.places || data.results || [];

      if (placesArray.length) {
        const typedResults = placesArray.map((place, index) => {
          const rawCategory = place.primaryType || (place.types && place.types[0]) || 'unknown';
          const normalizedCategory = rawCategory;

          const distanceKm = getDistanceFromLatLonInKm(
            location.lat,
            location.lng,
            place.location.latitude,
            place.location.longitude
          ).toFixed(1);

          return {
            id: place.id || `place-${index}`,
            name: place.name || place.displayName?.text || 'Unknown',
            category: normalizedCategory,
            categoryName: normalizedCategory.replace('_', ' '),
            distance: distanceKm,
            rating: place.rating ? place.rating.toFixed(1) : 'N/A',
            address: place.formattedAddress || 'Address not available',
            lat: place.location.latitude,
            lng: place.location.longitude,
            text: place.displayName?.text || '',
          };
        });

        allPlaces.push(...typedResults);
      }
    }

    allPlaces.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    res.status(200).json({ places: allPlaces });

  } catch (error) {
    console.error('Backend error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
