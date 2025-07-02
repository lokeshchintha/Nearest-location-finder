import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS for dev + production
app.use(cors({
  origin: [
    'https://nearest-location-finder-1-kcd0.onrender.com', 
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.use(express.json());

// ✅ Utility Functions
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

// ✅ Autocomplete Endpoint
app.get('/api/autocomplete', async (req, res) => {
  const input = req.query.input;

  if (!input) return res.status(400).json({ error: 'Missing input query parameter' });
  if (!process.env.MAPS_KEY) return res.status(500).json({ error: 'Missing MAPS_KEY in environment' });

  const url = `https://google-maps-api-free.p.rapidapi.com/google-autocomplete?input=${encodeURIComponent(input)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.MAPS_KEY,
        'x-rapidapi-host': 'google-maps-api-free.p.rapidapi.com'
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API returned non-OK:', errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    console.log("✅ Autocomplete results:", data);
    res.json(data);
  } catch (error) {
    console.error('❌ Autocomplete API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ✅ Nearby Places Endpoint
app.post('/api/nearby-places', async (req, res) => {
  const { location, placeTypes } = req.body;

  if (!location || !placeTypes?.length) {
    return res.status(400).json({ error: 'Missing location or placeTypes' });
  }

  if (!process.env.MAPS_KEY) {
    return res.status(500).json({ error: 'Missing MAPS_KEY in environment' });
  }

  try {
    const allPlaces = [];

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
        const errorText = await response.text();
        console.warn(`⚠️ Skipping ${type} due to error:`, errorText);
        continue;
      }

      const data = await response.json();
      const results = data.places || data.results || [];

      const typedResults = results
        .filter(place => place?.location?.latitude && place?.location?.longitude)
        .map((place, index) => {
          const distanceKm = getDistanceFromLatLonInKm(
            location.lat,
            location.lng,
            place.location.latitude,
            place.location.longitude
          ).toFixed(1);

          const category = place.primaryType || (place.types && place.types[0]) || 'unknown';

          return {
            id: place.id || `place-${index}`,
            name: place.name || place.displayName?.text || 'Unknown',
            category,
            categoryName: category.replace('_', ' '),
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

    allPlaces.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    return res.status(200).json(allPlaces);
  } catch (error) {
    console.error('❌ Nearby search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
