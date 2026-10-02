const { Resend } = require("resend");
const getIntegration = require("../integrations/getIntegration");

const executeEmailNode = async (
  node,
  input = {},
  context = {}
) => {
  const config =
    node.data?.config || {};

  const integration =
    await getIntegration({
      integrationId:
        config.integrationId,

      userId:
        context.userId,

      workspaceId:
        context.workspaceId,

      provider: "email",
    });

  const credentials =
    integration.credentials || {};

  const {
    apiKey,
    from,
  } = credentials;

  if (!apiKey) {
    throw new Error(
      "Resend API key is missing"
    );
  }

  if (!from) {
    throw new Error(
      "Email sender address is missing"
    );
  }

  if (!config.to) {
    throw new Error(
      "Email recipient is required"
    );
  }

  if (context.signal?.aborted) {
    const error = new Error(
      "Email node execution was cancelled"
    );

    error.code =
      "NODE_CANCELLED";

    throw error;
  }

  const resend =
    new Resend(apiKey);

  const subject =
    config.subject ||
    "FlowPilot Workflow";

  const text =
    config.message ||
    config.body ||
    JSON.stringify(input);

  const html =
    config.html ||
    `<p>${escapeHtml(text).replace(
      /\n/g,
      "<br />"
    )}</p>`;

  try {
    const emailData = {
      from,
      to: [config.to],
      subject,
      html,
      text,
    };

    if (context.idempotencyKey) {
      emailData.headers = {
        "X-FlowPilot-Idempotency-Key":
          context.idempotencyKey,

        "X-FlowPilot-Execution":
          context.executionId
            ? String(
                context.executionId
              )
            : undefined,
      };
    }

    const result =
      await resend.emails.send(
        emailData
      );

    if (context.signal?.aborted) {
      const error = new Error(
        "Email node execution was cancelled"
      );

      error.code =
        "NODE_CANCELLED";

      throw error;
    }

    if (result.error) {
      throw new Error(
        result.error.message ||
          "Resend failed to send email"
      );
    }

    const messageId =
      result.data?.id;

    console.log(
      `Email sent successfully: ${messageId}`
    );

    return {
      success: true,

      output: {
        messageId,

        to:
          config.to,

        subject,

        input,
      },
    };
  } catch (error) {
    console.error(
      "Email node failed:",
      error
    );

    throw error;
  }
};

const escapeHtml = (value) => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

module.exports =
  executeEmailNode;