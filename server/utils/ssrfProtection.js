const dns = require("dns").promises;
const net = require("net");

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "ip6-localhost",
  "ip6-loopback",
  "metadata.google.internal",
  "metadata",
]);

const normalizeIpv4 = (ip) => {
  const parts = ip.split(".");

  if (parts.length !== 4) {
    return null;
  }

  const numbers = parts.map(Number);

  if (
    numbers.some(
      (part) =>
        !Number.isInteger(part) ||
        part < 0 ||
        part > 255
    )
  ) {
    return null;
  }

  return numbers;
};

const ipv4ToNumber = (ip) => {
  const parts = normalizeIpv4(ip);

  if (!parts) {
    return null;
  }

  return (
    ((parts[0] << 24) >>> 0) +
    (parts[1] << 16) +
    (parts[2] << 8) +
    parts[3]
  );
};

const isPrivateIpv4 = (ip) => {
  const value = ipv4ToNumber(ip);

  if (value === null) {
    return true;
  }

  const ranges = [
    ["0.0.0.0", "0.255.255.255"],
    ["10.0.0.0", "10.255.255.255"],
    ["100.64.0.0", "100.127.255.255"],
    ["127.0.0.0", "127.255.255.255"],
    ["169.254.0.0", "169.254.255.255"],
    ["172.16.0.0", "172.31.255.255"],
    ["192.0.0.0", "192.0.0.255"],
    ["192.0.2.0", "192.0.2.255"],
    ["192.168.0.0", "192.168.255.255"],
    ["198.18.0.0", "198.19.255.255"],
    ["198.51.100.0", "198.51.100.255"],
    ["203.0.113.0", "203.0.113.255"],
    ["224.0.0.0", "255.255.255.255"],
  ];

  return ranges.some(([start, end]) => {
    const startValue =
      ipv4ToNumber(start);

    const endValue =
      ipv4ToNumber(end);

    return (
      value >= startValue &&
      value <= endValue
    );
  });
};

const isPrivateIpv6 = (ip) => {
  const normalized =
    ip.toLowerCase();

  if (
    normalized === "::1" ||
    normalized === "::"
  ) {
    return true;
  }
  if (
    normalized.startsWith(
      "::ffff:"
    )
  ) {
    const mapped =
      normalized.slice(7);

    if (net.isIP(mapped) === 4) {
      return isPrivateIpv4(mapped);
    }
  }
  if (
    normalized.startsWith("fc") ||
    normalized.startsWith("fd")
  ) {
    return true;
  }
  if (
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  ) {
    return true;
  }

  if (
    normalized.startsWith("2001:db8:") ||
    normalized.startsWith("2001:2:")
  ) {
    return true;
  }

  return false;
};

const isPrivateIp = (ip) => {
  const family = net.isIP(ip);

  if (family === 4) {
    return isPrivateIpv4(ip);
  }

  if (family === 6) {
    return isPrivateIpv6(ip);
  }

  return true;
};

const validateUrlProtocol = (url) => {
  if (
    url.protocol !== "http:" &&
    url.protocol !== "https:"
  ) {
    throw new Error(
      "HTTP node only supports http and https URLs"
    );
  }
};

const validateHostname = (hostname) => {
  const normalized =
    hostname.toLowerCase();

  if (
    BLOCKED_HOSTNAMES.has(
      normalized
    )
  ) {
    throw new Error(
      "HTTP node cannot access blocked hostnames"
    );
  }
  if (net.isIP(normalized)) {
    if (isPrivateIp(normalized)) {
      throw new Error(
        "HTTP node cannot access private or reserved IP addresses"
      );
    }

    return normalized;
  }

  return null;
};

const resolveSafeHost = async (
  hostname
) => {
  const directIp =
    validateHostname(hostname);

  if (directIp) {
    return {
      address: directIp,
      family: net.isIP(directIp),
    };
  }

  let addresses;

  try {
    addresses =
      await dns.lookup(hostname, {
        all: true,
        verbatim: true,
      });
  } catch (error) {
    throw new Error(
      `Unable to resolve HTTP node hostname: ${hostname}`
    );
  }

  if (
    !addresses ||
    addresses.length === 0
  ) {
    throw new Error(
      `Unable to resolve HTTP node hostname: ${hostname}`
    );
  }
  for (const address of addresses) {
    if (isPrivateIp(address.address)) {
      throw new Error(
        "HTTP node hostname resolves to a private or reserved IP address"
      );
    }
  }

  return addresses[0];
};

const validateAndPrepareHttpUrl =
  async (rawUrl) => {
    if (
      typeof rawUrl !== "string" ||
      !rawUrl.trim()
    ) {
      throw new Error(
        "HTTP node URL is required"
      );
    }

    let url;

    try {
      url = new URL(
        rawUrl.trim()
      );
    } catch (error) {
      throw new Error(
        "HTTP node URL is invalid"
      );
    }

    validateUrlProtocol(url);

    if (
      url.username ||
      url.password
    ) {
      throw new Error(
        "HTTP node URLs cannot contain embedded credentials"
      );
    }

    const resolved =
      await resolveSafeHost(
        url.hostname
      );

    return {
      url: url.toString(),
      hostname: url.hostname,
      address: resolved.address,
      family: resolved.family,
    };
  };

module.exports = {
  isPrivateIp,
  validateAndPrepareHttpUrl,
};