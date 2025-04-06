import { PropertyDetail } from '@/app/(tabs)/add';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// export const propertiesdata = async (data: PropertyDetail) => {
//   try {
//     console.log('Sending property data:', data); // Log the data being sent
//     console.log('API URL:', `${API_URL}/properties`); // Log the full URL

//     const response = await fetch(`${API_URL}/properties`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(data),
//     });
    
//     const responseData = await response.json();
//     console.log('Property API Response:', responseData);
    
//     if (!response.ok) {
//       throw new Error(`API error: ${JSON.stringify(responseData)}`);
//     }
    
//     return responseData;
//   } catch (error) {
//     console.error('Property API call failed:', error);
//     throw error;
//   }
// }; 

export const propertiesdata = async (data: PropertyDetail) => {
  try {
    // Ensure all required fields are present and properly formatted
    const formattedData = {
      valuation_no: data.valuation_no || '',
      valuation_amt: Number(data.valuation_amt) || 0,
      duration: Number(data.duration) || 0,
      property_type: data.property_type || '',
      units: Number(data.units) || 0,
      tax_rate: Number(data.tax_rate) || 0,
      tax_amt: Number(data.tax_amt) || 0,
      data_typeInfo: data.data_typeInfo || ''
    };
    
    console.log('Sending formatted property data:', JSON.stringify(formattedData, null, 2));
    console.log('API URL:', `${API_URL}/properties`);
    
    const res = await fetch(`${API_URL}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(formattedData),
    });
    
    // Log the raw response for debugging
    const responseText = await res.text();
    console.log('Raw API Response:', responseText);
    
    // Try to parse the response as JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse API response as JSON:', e);
      throw new Error(`API returned invalid JSON: ${responseText}`);
    }
    
    console.log('Parsed API Response:', responseData);
    
    if (!res.ok) {
      throw new Error(`API error: ${JSON.stringify(responseData)}`);
    }
    
    return responseData;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};