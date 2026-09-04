const axios = require("axios");

const executeHttpNode = async (node, input = {}) => {
  const config = node.data?.config || {};

  const method = (config.method || "GET").toUpperCase();
  const url = config.url;

  if (!url) {
    throw new Error("HTTP node URL is required");
  }

  let body = config.body || {};

  // If body is stored as JSON text, convert it to an object
  if (typeof body === "string" && body.trim()) {
    try {
      body = JSON.parse(body);
    } catch (error) {
      throw new Error("HTTP request body must be valid JSON");
    }
  }

  console.log(`HTTP ${method} ${url}`);

  const response = await axios({
    method,
    url,
    data: method === "GET" ? undefined : body,
  });

  return {
    success: true,
    output: {
      status: response.status,
      data: response.data,
      headers: response.headers,
      input,
    },
  };
};

module.exports = executeHttpNode;