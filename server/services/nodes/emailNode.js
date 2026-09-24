const nodemailer = require("nodemailer");
const getIntegration = require("../integrations/getIntegration");

const executeEmailNode = async (
  node,
  input = {},
  context = {}
) => {
  const config = node.data?.config || {};

  const integration = await getIntegration({
    integrationId: config.integrationId,
    userId: context.userId,
    workspaceId: context.workspaceId,
    provider: "email",
  });

  const credentials =
    integration.credentials || {};

  const {
    host,
    port,
    secure,
    username,
    password,
    from,
  } = credentials;

  if (!host) {
    throw new Error(
      "Email SMTP host is missing"
    );
  }

  if (!username) {
    throw new Error(
      "Email username is missing"
    );
  }

  if (!password) {
    throw new Error(
      "Email password is missing"
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

  const transporter =
    nodemailer.createTransport({
      host,
      port: Number(port) || 587,
      secure: Boolean(secure),
      auth: {
        user: username,
        pass: password,
      },
    });

  const abortHandler = () => {
    console.log(
      "Email node cancellation requested"
    );

    transporter.close();
  };

  if (context.signal) {
    if (context.signal.aborted) {
      transporter.close();

      throw new Error(
        "Email node execution was cancelled"
      );
    }

    context.signal.addEventListener(
      "abort",
      abortHandler,
      { once: true }
    );
  }

  const subject =
    config.subject ||
    "FlowPilot Workflow";

  const text =
    config.message ||
    config.body ||
    JSON.stringify(input);

  try {
    const mailOptions = {
      from,
      to: config.to,
      subject,
      text,
    };

    if (context.idempotencyKey) {
      mailOptions.headers = {
        "X-FlowPilot-Idempotency-Key":
          context.idempotencyKey,
      };
    }

    const info =
      await transporter.sendMail(
        mailOptions
      );

    if (context.signal?.aborted) {
      throw new Error(
        "Email node execution was cancelled"
      );
    }

    console.log(
      `Email sent successfully: ${info.messageId}`
    );

    return {
      success: true,
      output: {
        messageId: info.messageId,
        to: config.to,
        subject,
        input,
      },
    };
  } finally {
    if (context.signal) {
      context.signal.removeEventListener(
        "abort",
        abortHandler
      );
    }

    transporter.close();
  }
};

module.exports =
  executeEmailNode;