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

  if (!location || !placeTypes) {
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
              radius: 5000,
            },
          },
          maxResultCount: 10,
          includedTypes: [type],
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.places) continue;

      const results = data.places.map((place) => ({
        id: place.id,
        name: place.displayName?.text || place.name || 'Unknown',
        category: place.primaryType,
        address: place.formattedAddress || '',
        lat: place.location.latitude,
        lng: place.location.longitude,
        rating: place.rating || 'N/A',
      }));

      allPlaces.push(...results);
    }

    allPlaces.sort((a, b) => a.distance - b.distance);
    res.json(allPlaces);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching nearby places' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
