import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { orpcClient } from "@/lib/orpc-client";

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  size: number;
  optimizedUrls?: {
    thumbnail: string;
    medium: string;
    large: string;
  };
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UseFileUploadOptions {
  folder?: string;
  optimize?: boolean;
  onUploadStart?: () => void;
  onUploadProgress?: (progress: UploadProgress) => void;
  onUploadSuccess?: (result: UploadResult) => void;
  onUploadError?: (error: Error) => void;
  showToasts?: boolean;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const {
    folder = "events",
    optimize = true,
    onUploadStart,
    onUploadProgress,
    onUploadSuccess,
    onUploadError,
    showToasts = true,
  } = options;

  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      setIsUploading(true);
      setUploadProgress(0);

      onUploadStart?.();

      try {
        // Simulate upload progress since oRPC doesn't provide native progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const next = Math.min(prev + Math.random() * 30, 90);
            onUploadProgress?.({
              loaded: (next / 100) * file.size,
              total: file.size,
              percentage: next,
            });
            return next;
          });
        }, 200);

        const result = await orpcClient.fileUpload.uploadImage({
          file,
          folder,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!result.success) {
          throw new Error("Upload failed");
        }

        onUploadSuccess?.(result.data);

        if (showToasts) {
          toast.success("File uploaded successfully!");
        }

        return result.data;
      } catch (error) {
        setUploadProgress(0);
        const uploadError =
          error instanceof Error ? error : new Error("Upload failed");
        onUploadError?.(uploadError);

        if (showToasts) {
          toast.error(uploadError.message || "Failed to upload file");
        }

        throw uploadError;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const uploadFile = useCallback(
    (file: File) => {
      return uploadMutation.mutateAsync(file);
    },
    [uploadMutation],
  );

  const reset = useCallback(() => {
    setUploadProgress(0);
    setIsUploading(false);
    uploadMutation.reset();
  }, [uploadMutation]);

  return {
    uploadFile,
    uploadProgress,
    isUploading,
    isError: uploadMutation.isError,
    error: uploadMutation.error,
    isSuccess: uploadMutation.isSuccess,
    data: uploadMutation.data,
    reset,
  };
}

export function useMultiFileUpload(options: UseFileUploadOptions = {}) {
  const {
    folder = "events",
    optimize = true,
    onUploadStart,
    onUploadProgress,
    onUploadSuccess,
    onUploadError,
    showToasts = true,
  } = options;

  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]): Promise<UploadResult[]> => {
      setIsUploading(true);
      setUploadProgress(0);

      onUploadStart?.();

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const next = Math.min(prev + Math.random() * 20, 90);
            const totalSize = files.reduce((sum, file) => sum + file.size, 0);
            onUploadProgress?.({
              loaded: (next / 100) * totalSize,
              total: totalSize,
              percentage: next,
            });
            return next;
          });
        }, 300);

        const result = await orpcClient.fileUpload.uploadMultiple({
          files,
          folder,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!result.success) {
          throw new Error("Upload failed");
        }

        onUploadSuccess?.(result.data[0]); // For compatibility, return first file

        if (showToasts) {
          toast.success(`${files.length} files uploaded successfully!`);
        }

        return result.data;
      } catch (error) {
        setUploadProgress(0);
        const uploadError =
          error instanceof Error ? error : new Error("Upload failed");
        onUploadError?.(uploadError);

        if (showToasts) {
          toast.error(uploadError.message || "Failed to upload files");
        }

        throw uploadError;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const uploadFiles = useCallback(
    (files: File[]) => {
      return uploadMutation.mutateAsync(files);
    },
    [uploadMutation],
  );

  const reset = useCallback(() => {
    setUploadProgress(0);
    setIsUploading(false);
    uploadMutation.reset();
  }, [uploadMutation]);

  return {
    uploadFiles,
    uploadProgress,
    isUploading,
    isError: uploadMutation.isError,
    error: uploadMutation.error,
    isSuccess: uploadMutation.isSuccess,
    data: uploadMutation.data,
    reset,
  };
}

export function useFileDelete() {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (publicId: string) => {
      const result = await orpcClient.fileUpload.deleteFile({
        publicId,
      });

      if (!result.success) {
        throw new Error("Delete failed");
      }

      return result.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("File deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete file");
    },
  });

  const deleteFile = useCallback(
    (publicId: string) => {
      return deleteMutation.mutateAsync(publicId);
    },
    [deleteMutation],
  );

  return {
    deleteFile,
    isDeleting: deleteMutation.isPending,
    isError: deleteMutation.isError,
    error: deleteMutation.error,
    isSuccess: deleteMutation.isSuccess,
  };
}

export function useFileValidation() {
  const validateMutation = useMutation({
    mutationFn: async (params: {
      fileName: string;
      fileSize: number;
      fileType: string;
      maxSize?: number;
    }) => {
      const result = await orpcClient.fileUpload.validateFile(params);

      if (!result.success) {
        throw new Error("Validation failed");
      }

      return result.data;
    },
  });

  const validateFile = useCallback(
    (file: File, maxSize?: number) => {
      return validateMutation.mutateAsync({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        maxSize,
      });
    },
    [validateMutation],
  );

  return {
    validateFile,
    isValidating: validateMutation.isPending,
    isError: validateMutation.isError,
    error: validateMutation.error,
    data: validateMutation.data,
  };
}

export function useUploadConfig() {
  const configMutation = useMutation({
    mutationFn: async () => {
      const result = await orpcClient.fileUpload.getUploadConfig();

      if (!result.success) {
        throw new Error("Failed to get upload config");
      }

      return result.data;
    },
  });

  const getConfig = useCallback(() => {
    return configMutation.mutateAsync();
  }, [configMutation]);

  return {
    getConfig,
    isLoading: configMutation.isPending,
    config: configMutation.data,
    isError: configMutation.isError,
    error: configMutation.error,
  };
}

// Utility hook for optimized URLs
export function useOptimizedUrl() {
  const optimizeMutation = useMutation({
    mutationFn: async (params: {
      url: string;
      width?: number;
      height?: number;
      quality?: number;
      format?: "webp" | "jpg" | "png" | "auto";
    }) => {
      // Note: Local file upload doesn't support optimization
      throw new Error(
        "Image optimization not supported with local file upload",
      );
    },
  });

  const getOptimizedUrl = useCallback(
    (
      url: string,
      options: {
        width?: number;
        height?: number;
        quality?: number;
        format?: "webp" | "jpg" | "png" | "auto";
      } = {},
    ) => {
      return optimizeMutation.mutateAsync({ url, ...options });
    },
    [optimizeMutation],
  );

  return {
    getOptimizedUrl,
    isOptimizing: optimizeMutation.isPending,
    optimizedData: optimizeMutation.data,
    isError: optimizeMutation.isError,
    error: optimizeMutation.error,
  };
}
