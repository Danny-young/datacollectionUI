const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export const geodata = async (locationData: GeolocationData): Promise<GeolocationData> => {
  const res = await fetch(`${API_URL}/geoLocations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(locationData),
  });

  const data = await res.json();
  if (!res.ok) {
    throw Error('Failed to collect data');
  }
  return data;
};