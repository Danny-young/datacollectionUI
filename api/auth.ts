const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function login(user_name: string, password: string) {
  try {
    const res = await fetch(`${API_URL}/manage/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'            
      },
      body: JSON.stringify({ user_name, password }),        
    });
  
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || `Authentication failed`);
    }
    
    return data;  // This will contain {message: "Success!"}
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}


export async function register(name: string, email: string, phone_number: string) {
  try {
    const res = await fetch(`${API_URL}/manage/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, phone_number }),
    });

    const data = await res.json();
    
    // Check for specific error types from the backend
    if (!res.ok) {
      if (data.error === 'Email already exists') {
        throw new Error('This email is already registered');
      }
      if (data.error === 'Phone number already exists') {
        throw new Error('This phone number is already registered');
      }
      throw new Error(data.error || 'Failed to register');
    }

    return {
      message: data.message,
      AgentCode: data.AgentCode,
      temporaryPassword: data.temporaryPassword
    };
  } catch (error: any) {
    console.error('Registration Error:', error);
    // Preserve the error message from the backend
    throw new Error(error.message || 'Registration failed');
  }
}


export async function changePassword(user_name: string, oldPassword: string, newPassword: string) {
  try {
    const res = await fetch(`${API_URL}/manage/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'            
      },
      body: JSON.stringify({ user_name, oldPassword, newPassword }),        
    });
  
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || `Authentication failed`);
    }
    
    return data;  // This will contain {message: "Success!"}
  } catch (error) {
    console.error('Change Password error:', error);
    throw error;
  }
}
