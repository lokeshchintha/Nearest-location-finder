import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch'; // If using Node 18+, you can remove this

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

  if (!location || !placeTypes || !placeTypes.length) {
    return res.status(400).json({ error: 'Missing location or placeTypes' });
  }

  if (!process.env.MAPS_KEY) {
    console.error("❌ Missing MAPS_KEY in environment");
    return res.status(500).json({ error: 'Server misconfiguration: Missing API Key' });
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
        const errText = await response.text();
        console.error(`❌ API Error for type "${type}":`, errText);
        continue;
      }

      const data = await response.json();
      const placesArray = data.places || data.results || [];

      const typedResults = placesArray.map((place, index) => {
        const rawCategory = place.primaryType || (place.types && place.types[0]) || 'unknown';
        const distanceKm = getDistanceFromLatLonInKm(
          location.lat,
          location.lng,
          place.location.latitude,
          place.location.longitude
        ).toFixed(1);

        return {
          id: place.id || `place-${index}`,
          name: place.name || place.displayName?.text || 'Unknown',
          category: rawCategory,
          categoryName: rawCategory.replace('_', ' '),
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

    console.log("✅ Returning places count:", allPlaces.length);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(allPlaces); // Will return [] if empty
  } catch (error) {
    console.error('🔥 Server error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
