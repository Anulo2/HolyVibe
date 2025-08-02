import { ORPCError, os } from "@orpc/server";
import { z } from "zod";
import { createFileUploadService } from "../services/file-upload";
import { SuccessResponse } from "./helpers";
import { withAuth } from "./middleware";

const fileUploadService = createFileUploadService();

export const fileUploadRouter = os.router({
  // Upload a single image file
  uploadImage: withAuth
    .input(
      z.object({
        file: z.instanceof(File),
        folder: z.string().optional().default("events"),
        optimize: z.boolean().optional().default(true),
      }),
    )
    .output(
      SuccessResponse(
        z.object({
          url: z.string(),
          publicId: z.string(),
          width: z.number().optional(),
          height: z.number().optional(),
          format: z.string().optional(),
          size: z.number(),
          optimizedUrls: z.object({
            thumbnail: z.string(),
            medium: z.string(),
            large: z.string(),
          }).optional(),
        }),
      ),
    )
    .handler(async ({ input, context }) => {
      try {
        // Upload the file
        const uploadResult = await fileUploadService.uploadImage(
          input.file,
          input.folder,
        );

        // Generate optimized URLs if requested
        let optimizedUrls;
        if (input.optimize) {
          optimizedUrls = {
            thumbnail: fileUploadService.getOptimizedUrl(uploadResult.url, {
              width: 150,
              height: 150,
              quality: 80,
              format: "webp",
            }),
            medium: fileUploadService.getOptimizedUrl(uploadResult.url, {
              width: 400,
              height: 300,
              quality: 85,
              format: "webp",
            }),
            large: fileUploadService.getOptimizedUrl(uploadResult.url, {
              width: 800,
              height: 600,
              quality: 90,
              format: "webp",
            }),
          };
        }

        return {
          success: true,
          data: {
            ...uploadResult,
            optimizedUrls,
          },
        };
      } catch (error) {
        console.error("File upload error:", error);

        if (error instanceof ORPCError) {
          throw error;
        }

        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to upload file",
        });
      }
    }),

  // Upload multiple image files
  uploadMultiple: withAuth
    .input(
      z.object({
        files: z.array(z.instanceof(File)).min(1).max(10),
        folder: z.string().optional().default("events"),
        optimize: z.boolean().optional().default(true),
      }),
    )
    .output(
      SuccessResponse(
        z.array(
          z.object({
            url: z.string(),
            publicId: z.string(),
            width: z.number().optional(),
            height: z.number().optional(),
            format: z.string().optional(),
            size: z.number(),
            optimizedUrls: z.object({
              thumbnail: z.string(),
              medium: z.string(),
              large: z.string(),
            }).optional(),
          }),
        ),
      ),
    )
    .handler(async ({ input, context }) => {
      try {
        const uploadPromises = input.files.map(async (file) => {
          const uploadResult = await fileUploadService.uploadImage(
            file,
            input.folder,
          );

          // Generate optimized URLs if requested
          let optimizedUrls;
          if (input.optimize) {
            optimizedUrls = {
              thumbnail: fileUploadService.getOptimizedUrl(uploadResult.url, {
                width: 150,
                height: 150,
                quality: 80,
                format: "webp",
              }),
              medium: fileUploadService.getOptimizedUrl(uploadResult.url, {
                width: 400,
                height: 300,
                quality: 85,
                format: "webp",
              }),
              large: fileUploadService.getOptimizedUrl(uploadResult.url, {
                width: 800,
                height: 600,
                quality: 90,
                format: "webp",
              }),
            };
          }

          return {
            ...uploadResult,
            optimizedUrls,
          };
        });

        const results = await Promise.all(uploadPromises);

        return {
          success: true,
          data: results,
        };
      } catch (error) {
        console.error("Multiple file upload error:", error);

        if (error instanceof ORPCError) {
          throw error;
        }

        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to upload files",
        });
      }
    }),

  // Delete an uploaded file
  deleteFile: withAuth
    .input(
      z.object({
        publicId: z.string(),
      }),
    )
    .output(SuccessResponse(z.object({ deleted: z.boolean() })))
    .handler(async ({ input, context }) => {
      try {
        await fileUploadService.deleteImage(input.publicId);

        return {
          success: true,
          data: { deleted: true },
        };
      } catch (error) {
        console.error("File delete error:", error);

        if (error instanceof ORPCError) {
          throw error;
        }

        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to delete file",
        });
      }
    }),

  // Get optimized URL for an existing image
  getOptimizedUrl: withAuth
    .input(
      z.object({
        url: z.string().url(),
        width: z.number().optional(),
        height: z.number().optional(),
        quality: z.number().min(1).max(100).optional(),
        format: z.enum(["webp", "jpg", "png", "auto"]).optional(),
      }),
    )
    .output(
      SuccessResponse(
        z.object({
          originalUrl: z.string(),
          optimizedUrl: z.string(),
        }),
      ),
    )
    .handler(async ({ input }) => {
      try {
        const optimizedUrl = fileUploadService.getOptimizedUrl(input.url, {
          width: input.width,
          height: input.height,
          quality: input.quality,
          format: input.format,
        });

        return {
          success: true,
          data: {
            originalUrl: input.url,
            optimizedUrl,
          },
        };
      } catch (error) {
        console.error("URL optimization error:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to generate optimized URL",
        });
      }
    }),

  // Validate file before upload
  validateFile: withAuth
    .input(
      z.object({
        fileName: z.string(),
        fileSize: z.number(),
        fileType: z.string(),
        maxSize: z.number().optional().default(5 * 1024 * 1024), // 5MB default
      }),
    )
    .output(
      SuccessResponse(
        z.object({
          valid: z.boolean(),
          errors: z.array(z.string()),
          suggestions: z.array(z.string()).optional(),
        }),
      ),
    )
    .handler(async ({ input }) => {
      const errors: string[] = [];
      const suggestions: string[] = [];

      // Check file size
      if (input.fileSize > input.maxSize) {
        errors.push(
          `File size (${(input.fileSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(input.maxSize / 1024 / 1024).toFixed(2)}MB)`,
        );
        suggestions.push("Try compressing the image or choosing a smaller file");
      }

      // Check file type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(input.fileType)) {
        errors.push(`File type ${input.fileType} is not supported`);
        suggestions.push("Please use JPEG, PNG, WebP, or GIF format");
      }

      // Check file extension
      const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
      const fileExtension = input.fileName.toLowerCase().substring(input.fileName.lastIndexOf("."));
      if (!allowedExtensions.includes(fileExtension)) {
        errors.push(`File extension ${fileExtension} is not supported`);
      }

      // Suggest optimization if file is large but acceptable
      if (input.fileSize > 2 * 1024 * 1024 && input.fileSize <= input.maxSize) {
        suggestions.push("Consider compressing the image for faster uploads and better performance");
      }

      return {
        success: true,
        data: {
          valid: errors.length === 0,
          errors,
          suggestions: suggestions.length > 0 ? suggestions : undefined,
        },
      };
    }),

  // Get upload configuration
  getUploadConfig: withAuth
    .output(
      SuccessResponse(
        z.object({
          maxFileSize: z.number(),
          allowedTypes: z.array(z.string()),
          allowedExtensions: z.array(z.string()),
          provider: z.string(),
          supportsOptimization: z.boolean(),
        }),
      ),
    )
    .handler(async () => {
      return {
        success: true,
        data: {
          maxFileSize: 5 * 1024 * 1024, // 5MB
          allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
          provider: process.env.FILE_UPLOAD_PROVIDER || "local",
          supportsOptimization: process.env.FILE_UPLOAD_PROVIDER === "cloudinary",
        },
      };
    }),
});
