// Define the AddressObject type inline to avoid circular dependencies
interface AddressObject {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

/**
 * Format an address that can be either a string or an object into a string
 */
export function formatAddress(
  address: string | AddressObject | any | undefined | null
): string {
  if (!address) return '';

  // If it's already a string, return it
  if (typeof address === 'string') return address;

  // If it's an object, format it nicely
  const parts = [
    address.street,
    address.city,
    address.state,
    address.postal_code,
    address.country
  ].filter(Boolean);

  return parts.join(', ');
}

/**
 * Convert any address format to a string for form inputs
 */
export function addressToString(
  address: string | AddressObject | any | undefined | null
): string {
  return formatAddress(address);
}

/**
 * Check if an address is an object
 */
export function isAddressObject(
  address: string | AddressObject | any | undefined | null
): address is AddressObject {
  return typeof address === 'object' && address !== null;
}