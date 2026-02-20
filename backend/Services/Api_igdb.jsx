import axios from 'axios';



export const fetchIGDB = async (endpoint, query) => {
  try {
    const authRes = await axios.post(`${process.env.PROXY}${process.env.TOKEN_URL}`, null, {
      params: {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: 'client_credentials'
      }
    });

    const response = await axios({
      url: `${process.env.PROXY}${process.env.IGDB_URL}${endpoint}`,
      method: 'POST',
      headers: {
        'Client-ID': process.env.CLIENT_ID,
        'Authorization': `Bearer ${authRes.data.access_token}`,
        'Accept': 'application/json',
      },
      data: query
    });

    return response.data;
  } catch (error) {
    console.error("Erreur API:", error.response?.data || error.message);
    throw error;
  }
};