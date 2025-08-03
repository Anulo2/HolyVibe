import {
	AsYouType,
	getCountryCallingCode,
	parsePhoneNumber,
} from "libphonenumber-js";
import { ChevronDown, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CountryOption {
	code: string;
	name: string;
	flag: string;
	callingCode: string;
}

const countries: CountryOption[] = [
	{ code: "IT", name: "Italia", flag: "🇮🇹", callingCode: "+39" },
	{ code: "US", name: "Stati Uniti", flag: "🇺🇸", callingCode: "+1" },
	{ code: "GB", name: "Regno Unito", flag: "🇬🇧", callingCode: "+44" },
	{ code: "FR", name: "Francia", flag: "🇫🇷", callingCode: "+33" },
	{ code: "DE", name: "Germania", flag: "🇩🇪", callingCode: "+49" },
	{ code: "ES", name: "Spagna", flag: "🇪🇸", callingCode: "+34" },
	{ code: "CH", name: "Svizzera", flag: "🇨🇭", callingCode: "+41" },
];

interface PhoneInputProps {
	value?: string;
	onChange?: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	className?: string;
	id?: string;
	name?: string;
}

export function PhoneInput({
	value = "",
	onChange,
	placeholder = "Numero di telefono",
	disabled = false,
	required = false,
	className,
	id,
	name,
}: PhoneInputProps) {
	const [selectedCountry, setSelectedCountry] = useState<CountryOption>(
		countries[0],
	); // Default to Italy
	const [rawPhoneNumber, setRawPhoneNumber] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const [isValid, setIsValid] = useState(true);
	const [showHelperText, setShowHelperText] = useState(false);

	// Parse initial value if provided
	useEffect(() => {
		if (value && value !== (selectedCountry.callingCode + rawPhoneNumber)) {
			try {
				const parsed = parsePhoneNumber(value);
				if (parsed) {
					const country = countries.find((c) => c.code === parsed.country);
					if (country) {
						setSelectedCountry(country);
					}
					// Use nationalNumber to get only the number without country code
					setRawPhoneNumber(parsed.nationalNumber);
				} else {
					// If parsing fails, clean the number and check if it starts with country code
					let cleanNumber = value.replace(/\D/g, "");

					// Remove country code if present
					if (cleanNumber.startsWith("39") && cleanNumber.length > 10) {
						cleanNumber = cleanNumber.substring(2);
					}

					setRawPhoneNumber(cleanNumber);
				}
			} catch (error) {
				// Fallback for invalid numbers - ensure we don't include country code
				let cleanNumber = value.replace(/\D/g, "");
				if (cleanNumber.startsWith("39") && cleanNumber.length > 10) {
					cleanNumber = cleanNumber.substring(2);
				}
				setRawPhoneNumber(cleanNumber);
			}
		}
	}, [value]);

	const normalizePhoneNumber = (input: string): string => {
		// Remove all non-digit characters except + at the beginning
		let cleaned = input.replace(/[^\d+]/g, "");

		// Handle different Italian number formats
		if (!cleaned.startsWith("+")) {
			// Remove leading zeros
			cleaned = cleaned.replace(/^0+/, "");

			// If it starts with 39, it's likely an Italian number without +
			if (cleaned.startsWith("39")) {
				return "+" + cleaned;
			}

			// If it's 9-11 digits, assume it's an Italian mobile number
			if (cleaned.length >= 9 && cleaned.length <= 11) {
				return "+39" + cleaned;
			}
		}

		return cleaned;
	};

	const handlePhoneChange = (inputValue: string) => {
		// Only keep digits
		let cleanInput = inputValue.replace(/\D/g, "");

		// Remove country code if user accidentally types it
		if (selectedCountry.code === "IT" && cleanInput.startsWith("39") && cleanInput.length > 10) {
			cleanInput = cleanInput.substring(2);
		}
		// For other countries, remove their codes too
		else if (selectedCountry.code !== "IT") {
			const countryCode = selectedCountry.callingCode.replace("+", "");
			if (cleanInput.startsWith(countryCode) && cleanInput.length > countryCode.length + 7) {
				cleanInput = cleanInput.substring(countryCode.length);
			}
		}

		setRawPhoneNumber(cleanInput);

		// Build the complete international number
		const completeNumber = selectedCountry.callingCode + cleanInput;

		// Validate
		try {
			const normalized = normalizePhoneNumber(completeNumber);
			const parsed = parsePhoneNumber(normalized);

			if (parsed && parsed.isValid()) {
				setIsValid(true);
				onChange?.(parsed.format("E.164"));
			} else {
				setIsValid(cleanInput.length === 0); // Valid if empty, invalid if has content but malformed
				onChange?.(normalized || completeNumber);
			}
		} catch (error) {
			setIsValid(cleanInput.length === 0);
			onChange?.(completeNumber);
		}
	};

	const handleCountryChange = (country: CountryOption) => {
		setSelectedCountry(country);
		setIsOpen(false);

		// Update the complete number with the new country
		if (rawPhoneNumber) {
			const completeNumber = country.callingCode + rawPhoneNumber;
			onChange?.(completeNumber);
		}
	};

	return (
		<div className={cn("relative", className)}>
			<div className="flex">
				{/* Country Selector */}
				<div className="relative">
					<button
						type="button"
						onClick={() => setIsOpen(!isOpen)}
						disabled={disabled}
						className={cn(
							"flex items-center gap-2 px-3 py-2 border border-r-0 border-input bg-background rounded-l-md hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
							isOpen && "ring-2 ring-ring ring-offset-2",
							!isValid && rawPhoneNumber && "border-destructive",
						)}
					>
						<span className="text-sm">{selectedCountry.flag}</span>
						<span className="text-sm font-mono">
							{selectedCountry.callingCode}
						</span>
						<ChevronDown className="h-3 w-3 opacity-50" />
					</button>

					{isOpen && (
						<div className="absolute top-full left-0 mt-1 w-64 bg-popover border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
							{countries.map((country) => (
								<button
									key={country.code}
									type="button"
									onClick={() => handleCountryChange(country)}
									className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
								>
									<span>{country.flag}</span>
									<span className="font-mono text-muted-foreground">
										{country.callingCode}
									</span>
									<span className="flex-1 text-left">{country.name}</span>
								</button>
							))}
						</div>
					)}
				</div>

				{/* Phone Number Input */}
				<div className="relative flex-1">
					<input
						id={id}
						name={name}
						type="tel"
						value={rawPhoneNumber}
						onChange={(e) => handlePhoneChange(e.target.value)}
						onFocus={() => setShowHelperText(true)}
						onBlur={() => setShowHelperText(false)}
						placeholder={placeholder}
						required={required}
						disabled={disabled}
						className={cn(
							"flex h-10 w-full rounded-r-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
							!isValid &&
								rawPhoneNumber &&
								"border-destructive focus-visible:ring-destructive",
						)}
					/>
					<Phone
						className={cn(
							"absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none",
							!isValid && rawPhoneNumber
								? "text-destructive"
								: "text-muted-foreground",
						)}
					/>
				</div>
			</div>

			{/* Helper Text */}
			{(showHelperText || (!isValid && rawPhoneNumber)) && (
				<div className="mt-1 text-xs">
					{!isValid && rawPhoneNumber ? (
						<span className="text-destructive">Formato numero non valido</span>
					) : (
						<span className="text-muted-foreground">
							Inserisci il tuo numero di telefono
						</span>
					)}
				</div>
			)}

			{/* Overlay to close dropdown when clicking outside */}
			{isOpen && (
				<div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
			)}
		</div>
	);
}
