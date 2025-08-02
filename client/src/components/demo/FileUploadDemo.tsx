"use client";

import { Check, Copy, ExternalLink, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	type UploadResult,
	useFileDelete,
	useFileUpload,
	useMultiFileUpload,
} from "@/hooks/useFileUpload";

export function FileUploadDemo() {
	const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([]);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [copiedUrl, setCopiedUrl] = useState<string>("");

	// Single file upload
	const singleUpload = useFileUpload({
		folder: "demo",
		optimize: true,
		onUploadSuccess: (result) => {
			setUploadedFiles((prev) => [result, ...prev]);
			setSelectedFile(null);
			toast.success("File uploaded successfully!");
		},
		onUploadError: (error) => {
			toast.error(`Upload failed: ${error.message}`);
		},
		showToasts: false,
	});

	// Multiple file upload
	const multiUpload = useMultiFileUpload({
		folder: "demo",
		optimize: true,
		onUploadSuccess: () => {
			setSelectedFiles([]);
			toast.success("Files uploaded successfully!");
		},
		onUploadError: (error) => {
			toast.error(`Upload failed: ${error.message}`);
		},
		showToasts: false,
	});

	// File deletion
	const fileDelete = useFileDelete();

	const handleSingleFileSelect = (file: File) => {
		setSelectedFile(file);
	};

	const handleSingleFileRemove = () => {
		setSelectedFile(null);
	};

	const handleMultipleFileSelect = (file: File) => {
		setSelectedFiles((prev) => [...prev, file]);
	};

	const handleMultipleFileRemove = (index: number) => {
		setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const handleSingleUpload = async () => {
		if (!selectedFile) return;
		await singleUpload.uploadFile(selectedFile);
	};

	const handleMultipleUpload = async () => {
		if (selectedFiles.length === 0) return;
		const results = await multiUpload.uploadFiles(selectedFiles);
		setUploadedFiles((prev) => [...results, ...prev]);
	};

	const handleDeleteFile = async (publicId: string) => {
		if (confirm("Are you sure you want to delete this file?")) {
			await fileDelete.deleteFile(publicId);
			setUploadedFiles((prev) =>
				prev.filter((file) => file.publicId !== publicId),
			);
		}
	};

	const copyToClipboard = async (url: string) => {
		try {
			await navigator.clipboard.writeText(url);
			setCopiedUrl(url);
			toast.success("URL copied to clipboard!");
			setTimeout(() => setCopiedUrl(""), 2000);
		} catch (error) {
			toast.error("Failed to copy URL");
		}
	};

	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / k ** i).toFixed(2)) + " " + sizes[i];
	};

	return (
		<div className="container mx-auto p-6 max-w-4xl">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-2">Enhanced File Upload Demo</h1>
				<p className="text-muted-foreground">
					Demonstration of the new file upload system with cloud storage,
					optimization, and validation.
				</p>
			</div>

			<Tabs defaultValue="single" className="space-y-6">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="single">Single Upload</TabsTrigger>
					<TabsTrigger value="multiple">Multiple Upload</TabsTrigger>
					<TabsTrigger value="gallery">Uploaded Files</TabsTrigger>
				</TabsList>

				<TabsContent value="single" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Single File Upload</CardTitle>
							<CardDescription>
								Upload a single image with automatic optimization and
								validation.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<FileUpload
								onFileSelect={handleSingleFileSelect}
								onFileRemove={handleSingleFileRemove}
								accept="image/*"
								maxSize={5 * 1024 * 1024} // 5MB
								value={selectedFile || undefined}
								placeholder="Drag and drop an image here, or click to select"
								showPreview={true}
								disabled={singleUpload.isUploading}
								uploadProgress={singleUpload.uploadProgress}
								isUploading={singleUpload.isUploading}
								onValidationError={(error) => toast.error(error)}
							/>

							{selectedFile && (
								<div className="flex items-center justify-between p-3 bg-muted rounded-lg">
									<div>
										<p className="font-medium">{selectedFile.name}</p>
										<p className="text-sm text-muted-foreground">
											{formatFileSize(selectedFile.size)}
										</p>
									</div>
									<Button
										onClick={handleSingleUpload}
										disabled={singleUpload.isUploading}
										size="sm"
									>
										{singleUpload.isUploading ? "Uploading..." : "Upload"}
									</Button>
								</div>
							)}

							{singleUpload.isError && (
								<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
									<p className="text-sm text-destructive">
										{singleUpload.error?.message || "Upload failed"}
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="multiple" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Multiple File Upload</CardTitle>
							<CardDescription>
								Upload multiple images at once with batch processing.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<FileUpload
								onFileSelect={handleMultipleFileSelect}
								onFileRemove={() => {}} // Handled separately for multiple files
								accept="image/*"
								maxSize={5 * 1024 * 1024} // 5MB
								placeholder="Drag and drop images here, or click to select"
								showPreview={false}
								multiple={true}
								disabled={multiUpload.isUploading}
								uploadProgress={multiUpload.uploadProgress}
								isUploading={multiUpload.isUploading}
								onValidationError={(error) => toast.error(error)}
								variant="compact"
							/>

							{selectedFiles.length > 0 && (
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<h4 className="font-medium">
											Selected Files ({selectedFiles.length})
										</h4>
										<Button
											onClick={handleMultipleUpload}
											disabled={multiUpload.isUploading}
											size="sm"
										>
											{multiUpload.isUploading ? "Uploading..." : "Upload All"}
										</Button>
									</div>
									<div className="space-y-1">
										{selectedFiles.map((file, index) => (
											<div
												key={index}
												className="flex items-center justify-between p-2 bg-muted rounded"
											>
												<div>
													<p className="text-sm font-medium">{file.name}</p>
													<p className="text-xs text-muted-foreground">
														{formatFileSize(file.size)}
													</p>
												</div>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleMultipleFileRemove(index)}
													disabled={multiUpload.isUploading}
												>
													<Trash2 className="h-3 w-3" />
												</Button>
											</div>
										))}
									</div>
								</div>
							)}

							{multiUpload.isError && (
								<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
									<p className="text-sm text-destructive">
										{multiUpload.error?.message || "Upload failed"}
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="gallery" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Uploaded Files ({uploadedFiles.length})</CardTitle>
							<CardDescription>
								Gallery of uploaded files with optimization variants and
								management options.
							</CardDescription>
						</CardHeader>
						<CardContent>
							{uploadedFiles.length === 0 ? (
								<div className="text-center py-8 text-muted-foreground">
									No files uploaded yet. Try uploading some images using the
									tabs above.
								</div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{uploadedFiles.map((file) => (
										<Card key={file.publicId} className="overflow-hidden">
											<div className="aspect-video relative">
												<img
													src={file.optimizedUrls?.medium || file.url}
													alt="Uploaded file"
													className="w-full h-full object-cover"
												/>
												<div className="absolute top-2 right-2">
													<Button
														variant="destructive"
														size="sm"
														onClick={() => handleDeleteFile(file.publicId)}
														disabled={fileDelete.isDeleting}
													>
														<Trash2 className="h-3 w-3" />
													</Button>
												</div>
											</div>
											<CardContent className="p-3">
												<div className="space-y-2">
													<div className="flex items-center justify-between">
														<Badge variant="secondary">
															{formatFileSize(file.size)}
														</Badge>
														{file.width && file.height && (
															<Badge variant="outline">
																{file.width}×{file.height}
															</Badge>
														)}
													</div>

													<div className="space-y-1">
														<div className="flex items-center gap-2">
															<span className="text-xs font-medium">
																Original:
															</span>
															<Button
																variant="ghost"
																size="sm"
																onClick={() => copyToClipboard(file.url)}
																className="h-6 px-2"
															>
																{copiedUrl === file.url ? (
																	<Check className="h-3 w-3" />
																) : (
																	<Copy className="h-3 w-3" />
																)}
															</Button>
															<Button
																variant="ghost"
																size="sm"
																onClick={() => window.open(file.url, "_blank")}
																className="h-6 px-2"
															>
																<ExternalLink className="h-3 w-3" />
															</Button>
														</div>

														{file.optimizedUrls && (
															<>
																<div className="flex items-center gap-2">
																	<span className="text-xs font-medium">
																		Thumbnail:
																	</span>
																	<Button
																		variant="ghost"
																		size="sm"
																		onClick={() =>
																			copyToClipboard(
																				file.optimizedUrls!.thumbnail,
																			)
																		}
																		className="h-6 px-2"
																	>
																		{copiedUrl ===
																		file.optimizedUrls.thumbnail ? (
																			<Check className="h-3 w-3" />
																		) : (
																			<Copy className="h-3 w-3" />
																		)}
																	</Button>
																	<Button
																		variant="ghost"
																		size="sm"
																		onClick={() =>
																			window.open(
																				file.optimizedUrls!.thumbnail,
																				"_blank",
																			)
																		}
																		className="h-6 px-2"
																	>
																		<ExternalLink className="h-3 w-3" />
																	</Button>
																</div>

																<div className="flex items-center gap-2">
																	<span className="text-xs font-medium">
																		Large:
																	</span>
																	<Button
																		variant="ghost"
																		size="sm"
																		onClick={() =>
																			copyToClipboard(file.optimizedUrls!.large)
																		}
																		className="h-6 px-2"
																	>
																		{copiedUrl === file.optimizedUrls.large ? (
																			<Check className="h-3 w-3" />
																		) : (
																			<Copy className="h-3 w-3" />
																		)}
																	</Button>
																	<Button
																		variant="ghost"
																		size="sm"
																		onClick={() =>
																			window.open(
																				file.optimizedUrls!.large,
																				"_blank",
																			)
																		}
																		className="h-6 px-2"
																	>
																		<ExternalLink className="h-3 w-3" />
																	</Button>
																</div>
															</>
														)}
													</div>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Usage Statistics */}
			<Card className="mt-6">
				<CardHeader>
					<CardTitle>Upload Statistics</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div className="text-center">
							<div className="text-2xl font-bold">{uploadedFiles.length}</div>
							<div className="text-sm text-muted-foreground">Total Files</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold">
								{formatFileSize(
									uploadedFiles.reduce((sum, file) => sum + file.size, 0),
								)}
							</div>
							<div className="text-sm text-muted-foreground">Total Size</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold">
								{uploadedFiles.filter((file) => file.optimizedUrls).length}
							</div>
							<div className="text-sm text-muted-foreground">Optimized</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold">
								{uploadedFiles.filter((file) => file.format === "webp").length}
							</div>
							<div className="text-sm text-muted-foreground">WebP Format</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
