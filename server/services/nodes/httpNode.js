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
    throw new Error(
      "HTTP node URL is required"
    );
  }

  let headers =
    config.headers || {};

  let body =
    config.body || {};

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

  if (config.integrationId) {
    const integration =
      await getIntegration({
        integrationId:
          config.integrationId,

        userId:
          context.userId,

        workspaceId:
          context.workspaceId,

        provider: "http",
      });

    const credentials =
      integration.credentials || {};

    if (credentials.baseUrl) {
      url =
        `${credentials.baseUrl.replace(
          /\/$/,
          ""
        )}` +
        `${
          url.startsWith("/")
            ? url
            : `/${url}`
        }`;
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
        Authorization:
          `Bearer ${credentials.token}`,
      };
    }
  }

  /*
   * Idempotency
   *
   * The same execution + node receives
   * the same key across retry attempts.
   *
   * Replay creates a new execution ID,
   * therefore it receives a new key.
   */
  if (context.idempotencyKey) {
    headers = {
      ...headers,
      "Idempotency-Key":
        context.idempotencyKey,
    };
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

    signal:
      context.signal || undefined,
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

module.exports =
  executeHttpNode;