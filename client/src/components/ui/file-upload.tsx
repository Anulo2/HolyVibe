"use client";

import {
	AlertCircle,
	CheckCircle2,
	FileImage,
	Loader2,
	Upload,
	X,
} from "lucide-react";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface FileUploadProps {
	onFileSelect: (file: File) => void;
	onFileRemove: () => void;
	accept?: string;
	maxSize?: number; // in bytes
	className?: string;
	disabled?: boolean;
	value?: File | string; // File object or URL string
	placeholder?: string;
	showPreview?: boolean;
	multiple?: boolean;
	maxFiles?: number;
	onValidationError?: (error: string) => void;
	uploadProgress?: number;
	isUploading?: boolean;
	variant?: "default" | "compact" | "minimal";
}

interface FileValidation {
	isValid: boolean;
	error?: string;
	suggestion?: string;
}

export function FileUpload({
	onFileSelect,
	onFileRemove,
	accept = "image/*",
	maxSize = 5 * 1024 * 1024, // 5MB default
	className,
	disabled = false,
	value,
	placeholder = "Drag and drop an image here, or click to select",
	showPreview = true,
	multiple = false,
	maxFiles = 1,
	onValidationError,
	uploadProgress,
	isUploading = false,
	variant = "default",
}: FileUploadProps) {
	const [isDragOver, setIsDragOver] = useState(false);
	const [validationError, setValidationError] = useState<string>("");
	const [previewUrl, setPreviewUrl] = useState<string>("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Get display URL for preview
	const getDisplayUrl = useCallback(() => {
		if (typeof value === "string") {
			return value; // URL string
		}
		if (value instanceof File) {
			return previewUrl || URL.createObjectURL(value);
		}
		return "";
	}, [value, previewUrl]);

	// Validate file
	const validateFile = useCallback(
		(file: File): FileValidation => {
			// Check file size
			if (file.size > maxSize) {
				const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
				const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
				return {
					isValid: false,
					error: `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
					suggestion: "Try compressing the image or choosing a smaller file",
				};
			}

			// Check file type
			const allowedTypes = accept.split(",").map((type) => type.trim());
			const isValidType = allowedTypes.some((type) => {
				if (type === "image/*") return file.type.startsWith("image/");
				if (type.endsWith("/*")) return file.type.startsWith(type.slice(0, -1));
				return file.type === type;
			});

			if (!isValidType) {
				return {
					isValid: false,
					error: `File type ${file.type} is not supported`,
					suggestion: "Please select a supported file type",
				};
			}

			return { isValid: true };
		},
		[accept, maxSize],
	);

	// Handle file selection
	const handleFileSelect = useCallback(
		(files: FileList | null) => {
			if (!files || files.length === 0) return;

			const file = files[0]; // For now, handle single file
			const validation = validateFile(file);

			if (!validation.isValid) {
				setValidationError(validation.error || "Invalid file");
				onValidationError?.(validation.error || "Invalid file");
				return;
			}

			setValidationError("");

			// Create preview URL for images
			if (file.type.startsWith("image/")) {
				const url = URL.createObjectURL(file);
				setPreviewUrl(url);
			}

			onFileSelect(file);
		},
		[validateFile, onFileSelect, onValidationError],
	);

	// Handle drag events
	const handleDragOver = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			if (!disabled) {
				setIsDragOver(true);
			}
		},
		[disabled],
	);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragOver(false);

			if (disabled) return;

			const files = e.dataTransfer.files;
			handleFileSelect(files);
		},
		[disabled, handleFileSelect],
	);

	// Handle click to open file picker
	const handleClick = useCallback(() => {
		if (!disabled && fileInputRef.current) {
			fileInputRef.current.click();
		}
	}, [disabled]);

	// Handle file input change
	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			handleFileSelect(e.target.files);
			// Reset input value to allow selecting the same file again
			if (e.target) {
				e.target.value = "";
			}
		},
		[handleFileSelect],
	);

	// Handle file removal
	const handleRemove = useCallback(() => {
		setValidationError("");
		setPreviewUrl("");
		onFileRemove();
	}, [onFileRemove]);

	// Format file size
	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	const displayUrl = getDisplayUrl();
	const hasFile = !!value;

	if (variant === "compact") {
		return (
			<div className={cn("relative", className)}>
				<div className="flex items-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleClick}
						disabled={disabled || isUploading}
						className="flex-shrink-0"
					>
						{isUploading ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Upload className="h-4 w-4" />
						)}
						{hasFile ? "Change" : "Upload"}
					</Button>

					{hasFile && (
						<div className="flex items-center gap-2 flex-1 min-w-0">
							{showPreview && displayUrl && (
								<img
									src={displayUrl}
									alt="Preview"
									className="h-8 w-8 rounded object-cover flex-shrink-0"
								/>
							)}
							<span className="text-sm text-muted-foreground truncate">
								{value instanceof File ? value.name : "Uploaded image"}
							</span>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={handleRemove}
								disabled={disabled || isUploading}
								className="h-6 w-6 p-0 flex-shrink-0"
							>
								<X className="h-3 w-3" />
							</Button>
						</div>
					)}
				</div>

				{isUploading && uploadProgress !== undefined && (
					<Progress value={uploadProgress} className="mt-2" />
				)}

				{validationError && (
					<div className="flex items-center gap-1 mt-1">
						<AlertCircle className="h-3 w-3 text-destructive" />
						<span className="text-xs text-destructive">{validationError}</span>
					</div>
				)}

				<input
					ref={fileInputRef}
					type="file"
					accept={accept}
					multiple={multiple}
					onChange={handleInputChange}
					disabled={disabled}
					className="hidden"
				/>
			</div>
		);
	}

	if (variant === "minimal") {
		return (
			<div className={cn("relative", className)}>
				{hasFile ? (
					<div className="flex items-center gap-2">
						{showPreview && displayUrl && (
							<img
								src={displayUrl}
								alt="Preview"
								className="h-12 w-12 rounded object-cover"
							/>
						)}
						<div className="flex-1">
							<p className="text-sm font-medium">
								{value instanceof File ? value.name : "Uploaded image"}
							</p>
							{value instanceof File && (
								<p className="text-xs text-muted-foreground">
									{formatFileSize(value.size)}
								</p>
							)}
						</div>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleRemove}
							disabled={disabled || isUploading}
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
				) : (
					<Button
						type="button"
						variant="outline"
						onClick={handleClick}
						disabled={disabled || isUploading}
						className="w-full"
					>
						{isUploading ? (
							<Loader2 className="h-4 w-4 animate-spin mr-2" />
						) : (
							<Upload className="h-4 w-4 mr-2" />
						)}
						Select File
					</Button>
				)}

				<input
					ref={fileInputRef}
					type="file"
					accept={accept}
					multiple={multiple}
					onChange={handleInputChange}
					disabled={disabled}
					className="hidden"
				/>
			</div>
		);
	}

	// Default variant
	return (
		<div className={cn("relative", className)}>
			<div
				className={cn(
					"border-2 border-dashed rounded-lg transition-colors cursor-pointer",
					isDragOver && !disabled && "border-primary bg-primary/5",
					disabled && "opacity-50 cursor-not-allowed",
					validationError && "border-destructive",
					hasFile && "border-green-300 bg-green-50/50",
					!hasFile &&
						!validationError &&
						"border-muted-foreground/25 hover:border-muted-foreground/50",
				)}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				onClick={handleClick}
			>
				{hasFile ? (
					<div className="p-6">
						<div className="flex items-start gap-4">
							{showPreview && displayUrl ? (
								<img
									src={displayUrl}
									alt="Preview"
									className="h-20 w-20 rounded-lg object-cover flex-shrink-0"
								/>
							) : (
								<div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
									<FileImage className="h-8 w-8 text-muted-foreground" />
								</div>
							)}

							<div className="flex-1 min-w-0">
								<div className="flex items-start justify-between gap-2">
									<div>
										<p className="font-medium truncate">
											{value instanceof File ? value.name : "Uploaded image"}
										</p>
										{value instanceof File && (
											<p className="text-sm text-muted-foreground">
												{formatFileSize(value.size)}
											</p>
										)}
										<div className="flex items-center gap-1 mt-1">
											<CheckCircle2 className="h-4 w-4 text-green-600" />
											<span className="text-sm text-green-600">
												Ready to upload
											</span>
										</div>
									</div>

									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={(e) => {
											e.stopPropagation();
											handleRemove();
										}}
										disabled={disabled || isUploading}
										className="flex-shrink-0"
									>
										<X className="h-4 w-4" />
									</Button>
								</div>

								{isUploading && uploadProgress !== undefined && (
									<div className="mt-3">
										<div className="flex items-center justify-between text-sm mb-1">
											<span>Uploading...</span>
											<span>{uploadProgress}%</span>
										</div>
										<Progress value={uploadProgress} />
									</div>
								)}
							</div>
						</div>
					</div>
				) : (
					<div className="p-6 text-center">
						<div className="flex flex-col items-center gap-3">
							{isUploading ? (
								<Loader2 className="h-12 w-12 text-primary animate-spin" />
							) : validationError ? (
								<AlertCircle className="h-12 w-12 text-destructive" />
							) : (
								<Upload className="h-12 w-12 text-muted-foreground" />
							)}

							<div>
								<p className="text-base font-medium mb-1">
									{validationError || placeholder}
								</p>
								<p className="text-sm text-muted-foreground">
									{validationError ? (
										"Please fix the error and try again"
									) : (
										<>
											{accept.includes("image") && "PNG, JPG, WebP up to "}
											{formatFileSize(maxSize)}
										</>
									)}
								</p>
							</div>

							{!validationError && !isUploading && (
								<Badge variant="outline" className="mt-1">
									Click to browse or drag and drop
								</Badge>
							)}
						</div>
					</div>
				)}
			</div>

			{validationError && (
				<div className="flex items-center gap-2 mt-2 p-2 bg-destructive/10 rounded">
					<AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
					<span className="text-sm text-destructive">{validationError}</span>
				</div>
			)}

			<input
				ref={fileInputRef}
				type="file"
				accept={accept}
				multiple={multiple}
				onChange={handleInputChange}
				disabled={disabled}
				className="hidden"
			/>
		</div>
	);
}
