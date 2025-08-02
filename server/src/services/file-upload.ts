import { ORPCError } from "@orpc/server";
import { nanoid } from "nanoid";

// Configuration for different storage providers
interface FileUploadConfig {
  provider: "cloudinary" | "aws-s3" | "local";
  cloudinary?: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
  awsS3?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
  };
  local?: {
    uploadDir: string;
    baseUrl: string;
  };
}

interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  size: number;
}

class FileUploadService {
  private config: FileUploadConfig;

  constructor(config: FileUploadConfig) {
    this.config = config;
  }

  async uploadImage(file: File, folder?: string): Promise<UploadResult> {
    // Validate file
    this.validateImageFile(file);

    switch (this.config.provider) {
      case "cloudinary":
        return this.uploadToCloudinary(file, folder);
      case "aws-s3":
        return this.uploadToS3(file, folder);
      case "local":
        return this.uploadToLocal(file, folder);
      default:
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Unsupported storage provider",
        });
    }
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

  private async uploadToCloudinary(file: File, folder?: string): Promise<UploadResult> {
    if (!this.config.cloudinary) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Cloudinary configuration not provided",
      });
    }

    try {
      // Convert File to Buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Create form data for Cloudinary upload
      const formData = new FormData();
      formData.append("file", new Blob([buffer], { type: file.type }));
      formData.append("upload_preset", "ml_default"); // You'll need to create this in Cloudinary
      if (folder) {
        formData.append("folder", folder);
      }
      formData.append("public_id", `${folder || "uploads"}/${nanoid()}`);

      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.config.cloudinary.cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Cloudinary upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
      };
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to upload image to Cloudinary",
      });
    }
  }

  private async uploadToS3(file: File, folder?: string): Promise<UploadResult> {
    // AWS S3 implementation would go here
    // You'd use AWS SDK v3 here
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "AWS S3 upload not implemented yet",
    });
  }

  private async uploadToLocal(file: File, folder?: string): Promise<UploadResult> {
    if (!this.config.local) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Local storage configuration not provided",
      });
    }

    try {
      const { uploadDir, baseUrl } = this.config.local;
      const fileName = `${nanoid()}.${file.name.split('.').pop()}`;
      const relativePath = folder ? `${folder}/${fileName}` : fileName;
      const fullPath = `${uploadDir}/${relativePath}`;

      // Convert File to Buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Write file to local directory (you'd need to implement file system operations)
      // This is a simplified example - in practice you'd use fs/promises
      const fs = await import("fs/promises");
      const path = await import("path");

      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });

      // Write file
      await fs.writeFile(fullPath, buffer);

      return {
        url: `${baseUrl}/${relativePath}`,
        publicId: relativePath,
        size: file.size,
      };
    } catch (error) {
      console.error("Local upload error:", error);
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to upload image to local storage",
      });
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    switch (this.config.provider) {
      case "cloudinary":
        return this.deleteFromCloudinary(publicId);
      case "aws-s3":
        return this.deleteFromS3(publicId);
      case "local":
        return this.deleteFromLocal(publicId);
      default:
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Unsupported storage provider",
        });
    }
  }

  private async deleteFromCloudinary(publicId: string): Promise<void> {
    if (!this.config.cloudinary) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Cloudinary configuration not provided",
      });
    }

    try {
      const formData = new FormData();
      formData.append("public_id", publicId);
      formData.append("api_key", this.config.cloudinary.apiKey);

      // Create signature for authenticated request
      const timestamp = Math.round(Date.now() / 1000);
      const signature = this.createCloudinarySignature(
        `public_id=${publicId}&timestamp=${timestamp}`,
        this.config.cloudinary.apiSecret
      );

      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.config.cloudinary.cloudName}/image/destroy`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Cloudinary delete failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to delete image from Cloudinary",
      });
    }
  }

  private async deleteFromS3(publicId: string): Promise<void> {
    // AWS S3 delete implementation would go here
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "AWS S3 delete not implemented yet",
    });
  }

  private async deleteFromLocal(publicId: string): Promise<void> {
    if (!this.config.local) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Local storage configuration not provided",
      });
    }

    try {
      const fullPath = `${this.config.local.uploadDir}/${publicId}`;
      const fs = await import("fs/promises");
      await fs.unlink(fullPath);
    } catch (error) {
      console.error("Local delete error:", error);
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to delete image from local storage",
      });
    }
  }

  private createCloudinarySignature(paramsToSign: string, apiSecret: string): string {
    const crypto = require("crypto");
    return crypto
      .createHash("sha1")
      .update(paramsToSign + apiSecret)
      .digest("hex");
  }

  // Utility method to optimize images
  getOptimizedUrl(url: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  } = {}): string {
    if (this.config.provider !== "cloudinary") {
      return url; // Return original URL for non-Cloudinary providers
    }

    // For Cloudinary, we can add transformation parameters
    const transformations: string[] = [];

    if (options.width || options.height) {
      const crop = `c_fill`;
      if (options.width && options.height) {
        transformations.push(`w_${options.width},h_${options.height},${crop}`);
      } else if (options.width) {
        transformations.push(`w_${options.width},${crop}`);
      } else if (options.height) {
        transformations.push(`h_${options.height},${crop}`);
      }
    }

    if (options.quality) {
      transformations.push(`q_${options.quality}`);
    }

    if (options.format) {
      transformations.push(`f_${options.format}`);
    }

    if (transformations.length > 0) {
      const transformationString = transformations.join(",");
      return url.replace("/upload/", `/upload/${transformationString}/`);
    }

    return url;
  }
}

// Factory function to create file upload service
export function createFileUploadService(): FileUploadService {
  const provider = process.env.FILE_UPLOAD_PROVIDER as "cloudinary" | "aws-s3" | "local" || "local";

  const config: FileUploadConfig = {
    provider,
    cloudinary: provider === "cloudinary" ? {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
      apiKey: process.env.CLOUDINARY_API_KEY!,
      apiSecret: process.env.CLOUDINARY_API_SECRET!,
    } : undefined,
    awsS3: provider === "aws-s3" ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      region: process.env.AWS_REGION!,
      bucket: process.env.AWS_S3_BUCKET!,
    } : undefined,
    local: provider === "local" ? {
      uploadDir: process.env.LOCAL_UPLOAD_DIR || "./uploads",
      baseUrl: process.env.LOCAL_BASE_URL || "http://localhost:3000/uploads",
    } : undefined,
  };

  return new FileUploadService(config);
}

export { FileUploadService, type UploadResult, type FileUploadConfig };
