const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function listAgents() {
   // console.log(`${API_URL}/agents`);
//console.log(`listing to agents list`);
    const res = await fetch(`${API_URL}/agents`);
    const data = await res.json();
    console.log(data);
    return data;
}


export async function AgentbyID(username: string) {
    const res = await fetch(`${API_URL}/agents/${username}`);
    const data = await res.json();
    console.log("API Response for agent:", data);
    return data;
}

export interface UpdateAgentData {
    name: string;
    email: string;
    phone_number: string;
  }

  export async function updateAgent(username: string, data: UpdateAgentData) {
    try {
      const res = await fetch(`${API_URL}/agents/${username}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
  
      if (!res.ok) {
        const errorData = await res.json();
      }
  
      const responseData = await res.json();
      console.log("API Response for Update agent:", responseData);
      return responseData;
    } catch (error) {
      console.error("Update Agent Error:", error);
      throw error;
    }
  }






export async function testAgentByID() {
    const testUsername = 'AG030'; // Test username
    try {
        console.log(`Testing API URL: ${API_URL}/agents/${testUsername}`);
        const res = await fetch(`${API_URL}/agents/${testUsername}`);
        const data = await res.json();
        console.log("Test API Response:", data);
        return data;
    } catch (error) {
        console.error("Test API Error:", error);
        throw error;
    }
}