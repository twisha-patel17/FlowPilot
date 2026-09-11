const axios = require("axios");
const getIntegration = require("../integrations/getIntegration");

const executeHttpNode = async (
  node,
  input = {},
  context = {}
) => {
  const config = node.data?.config || {};

  const method = (
    config.method || "GET"
  ).toUpperCase();

  let url = config.url;

  if (!url) {
    throw new Error("HTTP node URL is required");
  }

  let headers = config.headers || {};

  let body = config.body || {};

  if (
    typeof body === "string" &&
    body.trim()
  ) {
    try {
      body = JSON.parse(body);
    } catch (error) {
      throw new Error(
        "HTTP request body must be valid JSON"
      );
    }
  }

  /*
   * HTTP integration is optional.
   *
   * If integrationId exists, load the connected
   * HTTP integration and use its credentials.
   */
  if (config.integrationId) {
    const integration = await getIntegration({
      integrationId: config.integrationId,
      userId: context.userId,
      workspaceId: context.workspaceId,
      provider: "http",
    });

    const credentials =
      integration.credentials || {};

    if (credentials.baseUrl) {
      url =
        `${credentials.baseUrl.replace(/\/$/, "")}` +
        `${url.startsWith("/") ? url : `/${url}`}`;
    }

    if (credentials.headers) {
      headers = {
        ...credentials.headers,
        ...headers,
      };
    }

    if (credentials.token) {
      headers = {
        ...headers,
        Authorization: `Bearer ${credentials.token}`,
      };
    }
  }

  console.log(
    `HTTP ${method} ${url}`
  );

  const response = await axios({
    method,
    url,
    headers,
    data:
      method === "GET"
        ? undefined
        : body,
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