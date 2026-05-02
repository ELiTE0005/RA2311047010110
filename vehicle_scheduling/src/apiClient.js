const axios = require('axios');

const BASE_URL = process.env.AUTH_BASE_URL || 'http://20.207.122.201/evaluation-service';

/**
 * Authenticates with the evaluation server and returns a Bearer token.
 * @returns {Promise<string>} The access token string
 */
async function getAuthToken() {
  const payload = {
    email: process.env.CLIENT_EMAIL || 'biswakalyan.hota@silicon.ac.in',
    name: process.env.CLIENT_NAME || 'biswa kalyan',
    rollNo: process.env.CLIENT_ROLL_NO || '22cs3fh010',
    accessCode: process.env.CLIENT_ACCESS_CODE || 'QkbpxH',
    clientID: process.env.CLIENT_ID || 'b73f1112-5aa7-4c1b-8062-a795be239c75',
    clientSecret: process.env.CLIENT_SECRET || 'TKwkXzKVZcFBjJbj',
  };

  try {
    const response = await axios.post(`${BASE_URL}/auth`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    const { access_token } = response.data;
    if (!access_token) {
      throw new Error('No access_token received from auth endpoint');
    }
    return access_token;
  } catch (error) {
    const errMsg = error.response
      ? `Status ${error.response.status}: ${JSON.stringify(error.response.data)}`
      : error.message;
    throw new Error(`Authentication failed: ${errMsg}`);
  }
}

/**
 * Fetches the list of depots from the evaluation server.
 * @param {string} token - Bearer token
 * @returns {Promise<Array>} Array of depot objects { ID, MechanicHours }
 */
async function fetchDepots(token) {
  try {
    const response = await axios.get(`${BASE_URL}/depots`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const depots = response.data.depots || response.data;
    if (!Array.isArray(depots)) {
      throw new Error('Unexpected depot response format');
    }
    return depots;
  } catch (error) {
    const errMsg = error.response
      ? `Status ${error.response.status}: ${JSON.stringify(error.response.data)}`
      : error.message;
    throw new Error(`Failed to fetch depots: ${errMsg}`);
  }
}

/**
 * Fetches the list of vehicle maintenance tasks from the evaluation server.
 * @param {string} token - Bearer token
 * @returns {Promise<Array>} Array of vehicle task objects { TaskID, Duration, Impact }
 */
async function fetchVehicles(token) {
  try {
    const response = await axios.get(`${BASE_URL}/vehicles`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const vehicles = response.data.vehicles || response.data;
    if (!Array.isArray(vehicles)) {
      throw new Error('Unexpected vehicles response format');
    }
    return vehicles;
  } catch (error) {
    const errMsg = error.response
      ? `Status ${error.response.status}: ${JSON.stringify(error.response.data)}`
      : error.message;
    throw new Error(`Failed to fetch vehicles: ${errMsg}`);
  }
}

module.exports = { getAuthToken, fetchDepots, fetchVehicles };
