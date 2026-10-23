// src/context/apiHelper.js
import axios from "axios";
import { API_BASE_URL, AUTH_TOKEN } from "../config/env.js";

const APIHelper = async (method, endpoint, data = null, config = {}) => {
  try {
    const isFormData = data instanceof FormData;

    const response = await axios({
      method: method,
      url: `${API_BASE_URL}${endpoint}`,
      data,
      headers: {
        ...(isFormData
          ? {} // Let Axios set multipart/form-data automatically
          : { "Content-Type": "application/json" }),
        Authorization: AUTH_TOKEN,
        // Add any additional headers from config
        ...config.headers,
      },
      // Merge any additional axios config
      ...config,
    });

    // If responseType is blob, return the blob directly
    if (config.responseType === "blob") {
      return response.data; // This will be a Blob object
    }

    // For regular JSON responses
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export default APIHelper;
