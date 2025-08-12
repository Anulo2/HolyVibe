import { parsePhoneNumber } from "libphonenumber-js";
import { useState } from "react";
import { PhoneInput } from "@/components/ui/phone-input";

export default function PhoneTestPage() {
	const [phoneNumber, setPhoneNumber] = useState("");
	const [testResults, setTestResults] = useState<
		Array<{
			input: string;
			normalized: string | null;
			isValid: boolean;
			formatted: string;
		}>
	>([]);

	const testCases = [
		"+39 3248921948",
		"393248921948",
		"3248921948",
		"324 892 19 48",
		"+39 324 892 1948",
		"0324 892 1948",
		"39 324 892 1948",
		"+393248921948",
		"324-892-1948",
		"324.892.1948",
		"invalid",
		"123",
		"+1 555 123 4567",
		"+44 20 7946 0958",
	];

	const normalizePhoneNumber = (input: string): string | null => {
		try {
			let cleaned = input.replace(/[^\d+]/g, "");

			if (!cleaned.startsWith("+")) {
				cleaned = cleaned.replace(/^0+/, "");

				if (cleaned.startsWith("39")) {
					cleaned = `+${cleaned}`;
				} else if (cleaned.length >= 9 && cleaned.length <= 11) {
					cleaned = `+39${cleaned}`;
				}
			}

			const parsed = parsePhoneNumber(cleaned);
			return parsed?.isValid() ? parsed.format("E.164") : null;
		} catch {
			return null;
		}
	};

	const formatForDisplay = (phoneNumber: string): string => {
		try {
			const parsed = parsePhoneNumber(phoneNumber);
			return parsed?.isValid() ? parsed.formatInternational() : phoneNumber;
		} catch {
			return phoneNumber;
		}
	};

	const runTests = () => {
		const results = testCases.map((input) => {
			const normalized = normalizePhoneNumber(input);
			return {
				input,
				normalized,
				isValid: normalized !== null,
				formatted: normalized ? formatForDisplay(normalized) : "Invalid",
			};
		});
		setTestResults(results);
	};

	const handlePhoneChange = (value: string) => {
		setPhoneNumber(value);
	};

	return (
		<div className="container mx-auto p-6 max-w-4xl">
			<h1 className="text-3xl font-bold mb-6">Phone Number Testing</h1>

			<div className="space-y-8">
				{/* Interactive Phone Input */}
				<div className="bg-card border rounded-lg p-6">
					<h2 className="text-xl font-semibold mb-4">
						Interactive Phone Input
					</h2>
					<div className="space-y-4">
						<PhoneInput
							value={phoneNumber}
							onChange={handlePhoneChange}
							placeholder="Inserisci il tuo numero"
						/>

						<div className="bg-muted p-3 rounded">
							<p className="text-sm">
								<strong>Valore corrente:</strong> {phoneNumber || "Nessuno"}
							</p>
							{phoneNumber && (
								<p className="text-sm">
									<strong>Formato display:</strong>{" "}
									{formatForDisplay(phoneNumber)}
								</p>
							)}
						</div>
					</div>
				</div>

				{/* Test Cases */}
				<div className="bg-card border rounded-lg p-6">
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xl font-semibold">Test di Normalizzazione</h2>
						<button
							onClick={runTests}
							className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
						>
							Esegui Test
						</button>
					</div>

					{testResults.length > 0 && (
						<div className="overflow-x-auto">
							<table className="w-full border-collapse border border-border">
								<thead>
									<tr className="bg-muted">
										<th className="border border-border p-2 text-left">
											Input
										</th>
										<th className="border border-border p-2 text-left">
											Normalizzato (E.164)
										</th>
										<th className="border border-border p-2 text-left">
											Formato Display
										</th>
										<th className="border border-border p-2 text-center">
											Valido
										</th>
									</tr>
								</thead>
								<tbody>
									{testResults.map((result, index) => (
										<tr
											key={index}
											className={result.isValid ? "" : "bg-destructive/10"}
										>
											<td className="border border-border p-2 font-mono text-sm">
												{result.input}
											</td>
											<td className="border border-border p-2 font-mono text-sm">
												{result.normalized || "null"}
											</td>
											<td className="border border-border p-2">
												{result.formatted}
											</td>
											<td className="border border-border p-2 text-center">
												<span
													className={`inline-block w-3 h-3 rounded-full ${
														result.isValid ? "bg-green-500" : "bg-red-500"
													}`}
												/>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>

				{/* Expected Behaviors */}
				<div className="bg-card border rounded-lg p-6">
					<h2 className="text-xl font-semibold mb-4">Comportamenti Attesi</h2>
					<ul className="space-y-2 text-sm">
						<li className="flex items-start gap-2">
							<span className="w-2 h-2 bg-green-500 rounded-full mt-2" />
							<span>
								<strong>+39 3248921948</strong> → Formato completo
								internazionale
							</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="w-2 h-2 bg-green-500 rounded-full mt-2" />
							<span>
								<strong>393248921948</strong> → Aggiunge + automaticamente
							</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="w-2 h-2 bg-green-500 rounded-full mt-2" />
							<span>
								<strong>3248921948</strong> → Aggiunge prefisso +39
							</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="w-2 h-2 bg-green-500 rounded-full mt-2" />
							<span>
								<strong>324 892 19 48</strong> → Rimuove spazi e normalizza
							</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="w-2 h-2 bg-green-500 rounded-full mt-2" />
							<span>
								<strong>0324 892 1948</strong> → Rimuove zero iniziale
							</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="w-2 h-2 bg-red-500 rounded-full mt-2" />
							<span>
								<strong>invalid</strong> → Formati non validi vengono rifiutati
							</span>
						</li>
					</ul>
				</div>

				{/* Usage Instructions */}
				<div className="bg-card border rounded-lg p-6">
					<h2 className="text-xl font-semibold mb-4">Come Usare</h2>
					<ol className="list-decimal list-inside space-y-2 text-sm">
						<li>Prova diversi formati nel campo di input sopra</li>
						<li>Osserva come vengono normalizzati in tempo reale</li>
						<li>Clicca "Esegui Test" per vedere tutti i casi di test</li>
						<li>I numeri validi vengono normalizzati in formato E.164</li>
						<li>
							I numeri italiani senza prefisso ricevono automaticamente +39
						</li>
					</ol>
				</div>
			</div>
		</div>
	);
}
