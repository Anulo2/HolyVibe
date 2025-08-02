# File Upload Configuration Guide

This guide explains how to configure file uploads for the HolyVibe application using different storage providers.

## Environment Variables

Add these variables to your `.env` file in the server directory:

### General Configuration
```env
# Storage provider: "cloudinary", "aws-s3", or "local"
FILE_UPLOAD_PROVIDER=local
```

### Local Storage (Default)
```env
FILE_UPLOAD_PROVIDER=local
LOCAL_UPLOAD_DIR=./uploads
LOCAL_BASE_URL=http://localhost:3000/uploads
```

### Cloudinary (Recommended for Production)
```env
FILE_UPLOAD_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### AWS S3
```env
FILE_UPLOAD_PROVIDER=aws-s3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name
```

## Storage Provider Setup

### 1. Local Storage Setup

Local storage is the default option and requires no additional setup. Files are stored in the `./uploads` directory relative to your server.

**Pros:**
- No external dependencies
- Free
- Fast for development

**Cons:**
- Not suitable for production with multiple servers
- No automatic optimization
- Manual backup required

**Setup:**
1. Ensure the uploads directory exists and is writable
2. Configure your web server to serve static files from the uploads directory
3. Set appropriate file permissions

### 2. Cloudinary Setup (Recommended)

Cloudinary provides automatic image optimization, transformations, and CDN delivery.

**Pros:**
- Automatic image optimization
- Multiple format support (WebP, AVIF)
- CDN delivery worldwide
- Automatic backups
- Image transformations on-the-fly

**Cons:**
- Paid service (has free tier)
- External dependency

**Setup:**
1. Create a Cloudinary account at https://cloudinary.com
2. Get your credentials from the dashboard
3. Create an upload preset (optional but recommended):
   - Go to Settings > Upload
   - Create a new upload preset
   - Set it to "Unsigned" for easier integration
   - Configure folder structure and transformations

### 3. AWS S3 Setup

AWS S3 provides scalable object storage with global availability.

**Pros:**
- Highly scalable
- Global availability
- Integration with other AWS services
- Fine-grained access controls

**Cons:**
- More complex setup
- Requires AWS knowledge
- Additional costs for bandwidth

**Setup:**
1. Create an AWS account
2. Create an S3 bucket
3. Create an IAM user with S3 permissions
4. Configure bucket policies for public read access (if needed)

## File Upload Limits

Default limits can be configured in the file upload service:

- **Maximum file size:** 5MB (configurable)
- **Allowed types:** JPEG, PNG, WebP, GIF
- **Maximum files per upload:** 10 (for multi-upload)

## Usage Examples

### Basic File Upload
```typescript
import { useFileUpload } from '@/hooks/useFileUpload';

const { uploadFile, isUploading, uploadProgress } = useFileUpload({
  folder: 'events',
  optimize: true,
  onUploadSuccess: (result) => {
    console.log('Uploaded:', result.url);
  }
});

// Upload a file
await uploadFile(selectedFile);
```

### Multiple File Upload
```typescript
import { useMultiFileUpload } from '@/hooks/useFileUpload';

const { uploadFiles, isUploading } = useMultiFileUpload({
  folder: 'gallery',
  optimize: true
});

// Upload multiple files
await uploadFiles([file1, file2, file3]);
```

### File Validation
```typescript
import { useFileValidation } from '@/hooks/useFileUpload';

const { validateFile } = useFileValidation();

const validation = await validateFile(file, 2 * 1024 * 1024); // 2MB limit
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

## Image Optimization

When using Cloudinary, images are automatically optimized with multiple sizes:

- **Thumbnail:** 150x150px, 80% quality, WebP format
- **Medium:** 400x300px, 85% quality, WebP format  
- **Large:** 800x600px, 90% quality, WebP format

You can access optimized URLs from the upload result:
```typescript
const result = await uploadFile(file);
console.log('Thumbnail:', result.optimizedUrls?.thumbnail);
console.log('Medium:', result.optimizedUrls?.medium);
console.log('Large:', result.optimizedUrls?.large);
```

## Security Considerations

1. **File Type Validation:** Only allow specific image formats
2. **File Size Limits:** Prevent oversized uploads
3. **Access Controls:** Configure proper permissions for storage
4. **Content Scanning:** Consider malware scanning for user uploads
5. **Rate Limiting:** Implement upload rate limits per user

## Error Handling

The upload system provides comprehensive error handling:

```typescript
const { uploadFile, isError, error } = useFileUpload({
  onUploadError: (error) => {
    if (error.message.includes('size')) {
      toast.error('File is too large. Please choose a smaller image.');
    } else if (error.message.includes('type')) {
      toast.error('Invalid file type. Please upload an image.');
    } else {
      toast.error('Upload failed. Please try again.');
    }
  }
});
```

## Migration from Base64

If migrating from the current base64 implementation:

1. **Gradual Migration:** Both systems can coexist
2. **Data Migration:** Convert existing base64 images to proper files
3. **URL Updates:** Update image URLs in database
4. **Cleanup:** Remove old base64 data after migration

## Performance Tips

1. **Image Compression:** Use optimized formats (WebP, AVIF)
2. **Lazy Loading:** Implement lazy loading for image lists
3. **CDN Usage:** Use CDN for faster global delivery
4. **Caching:** Implement proper caching headers
5. **Progressive Enhancement:** Show low-quality placeholders first

## Monitoring and Analytics

Track upload metrics:
- Upload success/failure rates
- Average upload times
- File sizes and types
- Storage usage
- Bandwidth consumption

## Backup and Recovery

**Cloudinary:** Automatic backups included
**AWS S3:** Configure versioning and cross-region replication
**Local:** Implement regular backup scripts

## Development vs Production

**Development:**
- Use local storage for faster iteration
- Lower file size limits for testing
- Mock external services when needed

**Production:**
- Use Cloudinary or AWS S3
- Implement proper monitoring
- Configure CDN and caching
- Set up backup strategies

## Troubleshooting

### Common Issues

1. **CORS Errors:** Configure CORS headers for cross-origin uploads
2. **Large File Timeouts:** Increase server timeout limits
3. **Permission Errors:** Check file/directory permissions
4. **Memory Issues:** Configure proper memory limits for large files

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=file-upload
```

This will log detailed upload information to help troubleshoot issues.