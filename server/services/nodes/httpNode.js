const axios = require("axios");

const getIntegration =
  require("../integrations/getIntegration");

const {
  validateAndPrepareHttpUrl,
} = require("../../utils/ssrfProtection");

const IDEMPOTENT_METHODS =
  new Set([
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
  ]);

const executeHttpNode = async (
  node,
  input = {},
  context = {}
) => {
  const config =
    node.data?.config || {};

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
      const baseUrl =
        credentials.baseUrl.replace(
          /\/$/,
          ""
        );

      url =
        `${baseUrl}` +
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
  const safeTarget =
    await validateAndPrepareHttpUrl(
      url
    );

  if (
    context.idempotencyKey &&
    IDEMPOTENT_METHODS.has(method)
  ) {
    headers = {
      ...headers,

      "Idempotency-Key":
        context.idempotencyKey,
    };
  }

  console.log(
    `HTTP ${method} ${safeTarget.url}`
  );

  const lookup = (
    hostname,
    options,
    callback
  ) => {
    if (
      hostname !==
      safeTarget.hostname
    ) {
      return callback(
        new Error(
          "HTTP node DNS hostname mismatch"
        )
      );
    }

    callback(
      null,
      safeTarget.address,
      safeTarget.family
    );
  };

  try {
    const response =
      await axios({
        method,

        url:
          safeTarget.url,

        headers,

        data:
          method === "GET"
            ? undefined
            : body,

        signal:
          context.signal ||
          undefined,

        maxRedirects: 0,

        lookup,
      });

    return {
      success: true,

      output: {
        status:
          response.status,

        data:
          response.data,

        headers:
          response.headers,

        input,
      },
    };
  } catch (error) {
    if (
      error.response?.status
    ) {
      error.statusCode =
        error.response.status;
    }

    throw error;
  }
};

module.exports =
  executeHttpNode;