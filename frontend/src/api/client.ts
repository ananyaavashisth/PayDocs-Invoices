/**
 * Centralized Axios client for the PayDocs API.
 *
 * Every API call in the app goes through this module so we have
 * a single place to configure the base URL, headers, and
 * interceptors.
 */

import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 5_000, // 5 seconds
});

export default apiClient;
