import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface OtpVerificationProps {
	onVerify: (code: string) => void;
	onResend: () => void;
}

export function OtpVerification({ onVerify, onResend }: OtpVerificationProps) {
	const [code, setCode] = useState("");

	return (
		<div className="space-y-4">
			<Input
				type="text"
				placeholder="Codice di verifica"
				value={code}
				onChange={(e) => setCode(e.target.value)}
			/>
			<Button onClick={() => onVerify(code)} className="w-full">
				Verifica
			</Button>
			<Button onClick={onResend} variant="link" className="w-full">
				Non hai ricevuto il codice? Invia di nuovo
			</Button>
		</div>
	);
}
