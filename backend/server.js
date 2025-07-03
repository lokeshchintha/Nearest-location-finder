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
  const location = req.query.location || '40,-110'; // optional
  const offset = req.query.offset || 3;

  if (!input) return res.status(400).json({ error: 'Missing input query parameter' });
  if (!process.env.MAPS_KEY) return res.status(500).json({ error: 'Missing MAPS_KEY in environment' });

  const url = `https://google-map-places.p.rapidapi.com/maps/api/place/queryautocomplete/json?input=${encodeURIComponent(input)}&radius=1000&language=en&location=${location}&offset=${offset}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.MAPS_KEY,
        'x-rapidapi-host': 'google-map-places.p.rapidapi.com',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API error:', data);
      return res.status(response.status).json({ error: data });
    }

    res.json({
      predictions: data.predictions || [],
      status: data.status
    });
  } catch (error) {
    console.error('❌ Autocomplete API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// ✅ Nearby Places Endpoint
app.post('/api/nearby-places', async (req, res) => {
  const { location, placeTypes } = req.body;

  if (!location || !placeTypes || !Array.isArray(placeTypes)) {
    return res.status(400).json({ error: 'Missing or invalid location or placeTypes' });
  }

  if (!process.env.MAPS_KEY) {
    return res.status(500).json({ error: 'Missing MAPS_KEY in environment' });
  }

  try {
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
        maxResultCount: 50,
        includedTypes: placeTypes, // ✅ pass all place types at once
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.places) {
      return res.status(500).json({ error: 'Failed to fetch places', details: data });
    }

    const results = data.places.map((place) => {
      const distance = getDistanceFromLatLonInKm(
        location.lat,
        location.lng,
        place.location.latitude,
        place.location.longitude
      );

      return {
        id: place.id,
        name: place.displayName?.text || place.name || 'Unknown',
        category: place.primaryType,
        address: place.formattedAddress || '',
        lat: place.location.latitude,
        lng: place.location.longitude,
        rating: place.rating || 'N/A',
        distance: parseFloat(distance.toFixed(2)),
      };
    });

    results.sort((a, b) => a.distance - b.distance);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching nearby places' });
  }
});


app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
