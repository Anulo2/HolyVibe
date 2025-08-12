import { ORPCError } from "@orpc/server";
import { nanoid } from "nanoid";
import { env } from "../env";

// Configuration for local file storage
interface FileUploadConfig {
	uploadDir: string;
	baseUrl: string;
}

interface UploadResult {
	url: string;
	publicId: string;
	size: number;
}

class FileUploadService {
	private config: FileUploadConfig;

	constructor(config: FileUploadConfig) {
		this.config = config;
	}

	async uploadImage(file: File, folder?: string): Promise<UploadResult> {
		console.log("📁 File upload started:", {
			fileName: file.name,
			fileSize: file.size,
			fileType: file.type,
			folder,
		});

		// Validate file
		this.validateImageFile(file);

		return this.uploadToLocal(file, folder);
	}

	private validateImageFile(file: File): void {
		// Check file size (max 5MB)
		const maxSize = 5 * 1024 * 1024;
		if (file.size > maxSize) {
			throw new ORPCError("BAD_REQUEST", {
				message: "File size must be less than 5MB",
			});
		}

		// Check file type
		const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
		if (!allowedTypes.includes(file.type)) {
			throw new ORPCError("BAD_REQUEST", {
				message: "File must be an image (JPEG, PNG, WebP, or GIF)",
			});
		}
	}

	private async uploadToLocal(
		file: File,
		folder?: string,
	): Promise<UploadResult> {
		try {
			const { uploadDir, baseUrl } = this.config;
			const fileName = `${nanoid()}.${file.name.split(".").pop()}`;
			const relativePath = folder ? `${folder}/${fileName}` : fileName;
			const fullPath = `${uploadDir}/${relativePath}`;

			console.log("📁 Local upload paths:", {
				uploadDir,
				baseUrl,
				fileName,
				relativePath,
				fullPath,
			});

			// Convert File to Buffer
			const buffer = Buffer.from(await file.arrayBuffer());

			// Write file to local directory
			const fs = await import("node:fs/promises");
			const path = await import("node:path");

			// Ensure directory exists
			await fs.mkdir(path.dirname(fullPath), { recursive: true });

			// Write file
			await fs.writeFile(fullPath, buffer);

			const result = {
				url: `${baseUrl}/${relativePath}`,
				publicId: relativePath,
				size: file.size,
			};

			console.log("📁 Upload successful, returning:", result);
			return result;
		} catch (error) {
			console.error("❌ Local upload error:", error);
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Failed to upload image to local storage",
			});
		}
	}

	async deleteImage(publicId: string): Promise<void> {
		try {
			const fullPath = `${this.config.uploadDir}/${publicId}`;
			const fs = await import("node:fs/promises");
			await fs.unlink(fullPath);
		} catch (error) {
			console.error("Local delete error:", error);
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Failed to delete image from local storage",
			});
		}
	}

	// For local storage, just return original URL
	getOptimizedUrl(url: string): string {
		return url;
	}
}

// Factory function to create file upload service
export function createFileUploadService(): FileUploadService {
	console.log("🔧 File upload service configuration:", {
		LOCAL_UPLOAD_DIR: env.LOCAL_UPLOAD_DIR,
		LOCAL_BASE_URL: env.LOCAL_BASE_URL,
	});

	const config: FileUploadConfig = {
		uploadDir: env.LOCAL_UPLOAD_DIR || "./uploads",
		baseUrl: env.LOCAL_BASE_URL || "/uploads",
	};

	console.log("🔧 Final file upload config:", config);

	return new FileUploadService(config);
}

export { FileUploadService, type UploadResult, type FileUploadConfig };
