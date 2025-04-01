const SMS_URL = process.env.EXPO_PUBLIC_SMS_URL;


// Add these to your .env file
const SMS_USERNAME = process.env.EXPO_PUBLIC_SMS_USERNAME;
const SMS_PASSWORD = process.env.EXPO_PUBLIC_SMS_PASSWORD;
//const SMS_MSISDN = process.env.EXPO_PUBLIC_SMS_MSISDN;
const SMS_SENDER_ID = process.env.EXPO_PUBLIC_SENDER_ID;


interface SMSData {
  phone_number: string;
  message: string;
}

export const sendSMS = async (data: SMSData) => {
  try {
    console.log('SMS Payload:', {
      username: SMS_USERNAME,
      password: SMS_PASSWORD,
    //   msisdn: SMS_MSISDN,
      message: data.message,
      sender_id: SMS_SENDER_ID,
      msisdn: data.phone_number
    });

    const response = await fetch(`${SMS_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: SMS_USERNAME,
        password: SMS_PASSWORD,
        msisdn: data.phone_number,
        message: data.message,
        sender_id: SMS_SENDER_ID
      }),
    });

    // Log the raw response
    const responseText = await response.text();
    console.log('SMS API Response:', responseText);
    console.log('Response Status:', response.status);
    console.log('Response Headers:', response.headers);

    if (!response.ok) {
      throw new Error(`SMS API error: ${responseText}`);
    }

    return JSON.parse(responseText);
  } catch (error) {
    console.error('Detailed SMS Error:', error);
    throw error;
  }
}; 