/**
 * PUBLIC_STOREFRONT_ID may be the numeric ID Oxygen injects ("1000182960") or the GID from
 * .shopify/project.json ("gid://shopify/HydrogenStorefront/1000182960"). Monorail's
 * hydrogenSubchannelId (Live View attribution) is the numeric ID, so both are normalised to it.
 * Returns '' when unset or malformed; callers must not substitute a placeholder.
 */
export function normalizeStorefrontId(value: string | null | undefined): string {
  const match = String(value ?? '')
    .trim()
    .match(/^(?:gid:\/\/shopify\/HydrogenStorefront\/)?(\d+)$/);
  return match ? match[1] : '';
}
