import { AppError } from "@/lib/errors";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata.google.com",
  "instance-data",
]);

const BLOCKED_HOSTNAME_SUFFIXES = [
  ".local",
  ".internal",
  ".localhost",
  ".lan",
  ".home",
  ".corp",
];

const METADATA_HOSTS = new Set([
  "169.254.169.254",
  "metadata.google.internal",
  "metadata.google.com",
]);

function isIP(ip: string): 0 | 4 | 6 {
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    return ip.split(".").every((part) => Number(part) <= 255) ? 4 : 0;
  }
  if (ip.includes(":")) {
    return 6;
  }
  return 0;
}

export type ParsedPublicUrl = {
  href: string;
  hostname: string;
  protocol: "http:" | "https:";
};

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

function isPrivateIPv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  return (
    (n >= ipv4ToInt("10.0.0.0") && n <= ipv4ToInt("10.255.255.255")) ||
    (n >= ipv4ToInt("127.0.0.0") && n <= ipv4ToInt("127.255.255.255")) ||
    (n >= ipv4ToInt("169.254.0.0") && n <= ipv4ToInt("169.254.255.255")) ||
    (n >= ipv4ToInt("172.16.0.0") && n <= ipv4ToInt("172.31.255.255")) ||
    (n >= ipv4ToInt("192.168.0.0") && n <= ipv4ToInt("192.168.255.255")) ||
    (n >= ipv4ToInt("0.0.0.0") && n <= ipv4ToInt("0.255.255.255"))
  );
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.") ||
    /^::ffff:169\.254\./.test(normalized) ||
    /^::ffff:172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)
  );
}

export function isBlockedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    return isPrivateIPv4(ip) || METADATA_HOSTS.has(ip);
  }
  if (version === 6) {
    return isPrivateIPv6(ip);
  }
  return true;
}

export function assertPublicHttpUrl(raw: string): ParsedPublicUrl {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new AppError({
      code: "INVALID_URL",
      message: "Invalid URL",
      userMessage: "Uneta adresa nije validan URL.",
    });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new AppError({
      code: "BLOCKED_PROTOCOL",
      message: `Blocked protocol ${parsed.protocol}`,
      userMessage: "Dozvoljeni su samo HTTP i HTTPS izvori.",
    });
  }

  if (parsed.username || parsed.password) {
    throw new AppError({
      code: "BLOCKED_CREDENTIALS",
      message: "URLs with credentials are blocked",
      userMessage: "URL ne sme da sadrži korisničko ime ili lozinku.",
    });
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
  ) {
    throw new AppError({
      code: "BLOCKED_HOST",
      message: `Blocked hostname ${hostname}`,
      userMessage: "Interni ili lokalni hostovi nisu dozvoljeni.",
    });
  }

  if (isIP(hostname) && isBlockedIp(hostname)) {
    throw new AppError({
      code: "BLOCKED_IP",
      message: `Blocked IP ${hostname}`,
      userMessage: "Privatne i link-local IP adrese nisu dozvoljene.",
    });
  }

  return {
    href: parsed.href,
    hostname,
    protocol: parsed.protocol,
  };
}

export function stripTrackingParams(url: string): string {
  const parsed = new URL(url);
  const blocked = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "fbclid",
    "gclid",
    "mc_cid",
    "mc_eid",
    "igshid",
    "_ga",
  ];
  for (const key of blocked) {
    parsed.searchParams.delete(key);
  }
  return parsed.toString();
}

export const SSRF_MAX_REDIRECTS = 3;
export const SSRF_TIMEOUT_MS = 12_000;
export const SSRF_MAX_BYTES = 2_500_000;
