import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS fix for local dev and production frontend
app.use(cors({
  origin: ['http://localhost:8080', 'https://nearest-location-finder-1-kcd0.onrender.com'], // replace with actual prod URL if needed
  methods: ['GET', 'POST'],
  credentials: true,
}));

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

app.get('/api/autocomplete', async (req, res) => {
  const input = req.query.input;
  const location = req.query.location || '40,-110';  // default if not provided
  const radius = req.query.radius || '1000';

  if (!input) {
    return res.status(400).json({ error: 'Missing input query parameter' });
  }

  const url = `https://google-map-places.p.rapidapi.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&radius=${radius}&strictbounds=true&location=${encodeURIComponent(location)}&language=en&region=en`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.MAPS_KEY,
        'x-rapidapi-host': 'google-map-places.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('API request failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/nearby-places', async (req, res) => {
  const { location, placeTypes } = req.body;

  if (!location || !placeTypes || !placeTypes.length) {
    console.log("❌ Missing location or placeTypes");
    return res.status(400).json({ error: 'Missing location or placeTypes' });
  }

  try {
    console.log("📍 Request received for location:", location);
    const allPlaces = [];

    for (const type of placeTypes) {
      console.log("🔍 Searching type:", type);

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
        console.error('⚠️ RapidAPI error:', errText);
        continue; // skip this type
      }

      const data = await response.json();
      console.log(`✅ ${type} results:`, data?.places?.length || data?.results?.length || 0);

      const placesArray = data.places || data.results || [];

      const typedResults = placesArray.map((place, index) => {
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

    console.log("🚀 Sending back", allPlaces.length, "places (sorted by distance)");
    return res.status(200).json(allPlaces);
  } catch (error) {
    console.error('❌ Server error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
