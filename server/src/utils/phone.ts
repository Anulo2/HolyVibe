import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js";

/**
 * Normalizes a phone number to E.164 format, with special handling for Italian numbers
 * @param phoneNumber - The phone number to normalize
 * @param defaultCountry - Default country code (defaults to 'IT' for Italy)
 * @returns Normalized phone number in E.164 format or null if invalid
 */
export function normalizePhoneNumber(
	phoneNumber: string,
	defaultCountry: string = "IT",
): string | null {
	if (!phoneNumber) {
		return null;
	}

	// Remove all whitespace and special characters except + and digits
	let cleaned = phoneNumber.replace(/[^\d+]/g, "");

	if (!cleaned) {
		return null;
	}

	try {
		// Handle different Italian number formats
		if (!cleaned.startsWith("+")) {
			// Remove leading zeros
			cleaned = cleaned.replace(/^0+/, "");

			// If it starts with 39, it's likely an Italian number without +
			if (cleaned.startsWith("39")) {
				cleaned = "+" + cleaned;
			}
			// If it's 9-11 digits and default country is Italy, assume it's Italian
			else if (
				cleaned.length >= 9 &&
				cleaned.length <= 11 &&
				defaultCountry === "IT"
			) {
				cleaned = "+39" + cleaned;
			}
			// For other cases, try parsing with default country
			else {
				const withCountryCode = parsePhoneNumber(
					cleaned,
					defaultCountry as any,
				);
				if (withCountryCode && withCountryCode.isValid()) {
					return withCountryCode.format("E.164");
				}
			}
		}

		// Parse the phone number
		const parsed = parsePhoneNumber(cleaned);

		if (parsed && parsed.isValid()) {
			return parsed.format("E.164");
		}

		return null;
	} catch (error) {
		console.error("Error normalizing phone number:", error);
		return null;
	}
}

/**
 * Validates if a phone number is valid
 * @param phoneNumber - The phone number to validate
 * @param defaultCountry - Default country code (defaults to 'IT' for Italy)
 * @returns True if the phone number is valid
 */
export function isValidPhone(
	phoneNumber: string,
	defaultCountry: string = "IT",
): boolean {
	const normalized = normalizePhoneNumber(phoneNumber, defaultCountry);
	return normalized !== null && isValidPhoneNumber(normalized);
}

/**
 * Formats a phone number for display
 * @param phoneNumber - The phone number to format
 * @param format - The format to use ('national' | 'international' | 'e164')
 * @returns Formatted phone number or the original if formatting fails
 */
export function formatPhoneNumber(
	phoneNumber: string,
	format: "national" | "international" | "e164" = "international",
): string {
	try {
		const parsed = parsePhoneNumber(phoneNumber);

		if (parsed && parsed.isValid()) {
			switch (format) {
				case "national":
					return parsed.formatNational();
				case "international":
					return parsed.formatInternational();
				case "e164":
					return parsed.format("E.164");
				default:
					return parsed.formatInternational();
			}
		}

		return phoneNumber;
	} catch (error) {
		console.error("Error formatting phone number:", error);
		return phoneNumber;
	}
}

/**
 * Checks if two phone numbers are equivalent (same number, different formats)
 * @param phone1 - First phone number
 * @param phone2 - Second phone number
 * @returns True if the phone numbers are equivalent
 */
export function arePhoneNumbersEquivalent(
	phone1: string,
	phone2: string,
): boolean {
	const normalized1 = normalizePhoneNumber(phone1);
	const normalized2 = normalizePhoneNumber(phone2);

	return (
		normalized1 !== null && normalized2 !== null && normalized1 === normalized2
	);
}

/**
 * Extracts the country from a phone number
 * @param phoneNumber - The phone number to analyze
 * @returns The country code or null if not determinable
 */
export function getPhoneNumberCountry(phoneNumber: string): string | null {
	try {
		const normalized = normalizePhoneNumber(phoneNumber);
		if (!normalized) return null;

		const parsed = parsePhoneNumber(normalized);
		return parsed?.country || null;
	} catch (error) {
		console.error("Error getting phone number country:", error);
		return null;
	}
}
