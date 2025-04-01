const API_URL = process.env.EXPO_PUBLIC_API_URL;


import { FormDataType } from '@/app/(tabs)/add';
// OR from a shared types file:
// import { FormDataType } from '@/types';

export const collectiondata = async (data: FormDataType) => {
  try {
    console.log('Sending data:', data); // Log the data being sent
    const res = await fetch(`${API_URL}/collectedData`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const responseData = await res.json();
    console.log('API Response:', responseData); // Log the API response
    
    if (!res.ok) {
      throw new Error(`API error: ${JSON.stringify(responseData)}`);
    }
    
    return responseData;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};
// export async function collectiondata() {
//     const res = await fetch(`${API_URL}/collectedData`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({}),
//     });
  
//     const data = await res.json();
//     if (!res.ok) {
//       console.log(data);
//       throw Error('Failed to collect data');
//     }
//     return data;  
//   }

  export const fetchLocations = async () => {
    try {
      const response = await fetch(`${API_URL}/electoralarea`);
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error('Failed to fetch electoralarea');
    }
  };

  export const fetchLocality = async () => {
    try {
      const response = await fetch(`${API_URL}/localities`);
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error('Failed to fetch localities');
    }
  };

  export const fetchLocalitiesByMunicipality = async (municipality: string) => {
    try {
      // First get the electoral area data
      const electoralAreaResponse = await fetch(`${API_URL}/electoralarea`);
      const electoralAreas = await electoralAreaResponse.json();
      
      // Find the electoral area ID for the selected municipality
      const selectedArea = electoralAreas.find(
        (area: any) => area.municipalities === municipality
      );

      if (!selectedArea) {
        throw new Error('Municipality not found');
      }

      // Then fetch localities using the electoral area ID
      const localitiesResponse = await fetch(`${API_URL}/localities`);
      const allLocalities = await localitiesResponse.json();
      
      // Filter localities that match the electoral area ID
      const filteredLocalities = allLocalities.filter(
        (locality: any) => locality.electoralAreaId === selectedArea.id
      );

      return filteredLocalities;
    } catch (error) {
      throw new Error(`Failed to fetch localities for municipality: ${municipality}`);
    }
  };