import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { AppError } from "@/lib/errors";
import { isBlockedIp } from "@/lib/security/url-guards";

export {
  assertPublicHttpUrl,
  isBlockedIp,
  stripTrackingParams,
  SSRF_MAX_BYTES,
  SSRF_MAX_REDIRECTS,
  SSRF_TIMEOUT_MS,
} from "@/lib/security/url-guards";

export async function resolveAndAssertPublicHost(
  hostname: string,
): Promise<string[]> {
  if (isIP(hostname)) {
    if (isBlockedIp(hostname)) {
      throw new AppError({
        code: "BLOCKED_IP",
        message: `Blocked IP ${hostname}`,
        userMessage: "Privatne i link-local IP adrese nisu dozvoljene.",
      });
    }
    return [hostname];
  }

  const records = await lookup(hostname, { all: true, verbatim: true });
  const addresses = records.map((record) => record.address);
  if (addresses.length === 0) {
    throw new AppError({
      code: "DNS_FAILED",
      message: `No DNS records for ${hostname}`,
      userMessage: "Nije moguće razrešiti domen izvora.",
    });
  }
  for (const address of addresses) {
    if (isBlockedIp(address)) {
      throw new AppError({
        code: "SSRF_BLOCKED",
        message: `DNS for ${hostname} resolved to blocked address ${address}`,
        userMessage: "Izvor pokazuje na internu mrežu i blokiran je.",
      });
    }
  }
  return addresses;
}
