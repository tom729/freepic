# COS Integration Module - Evidence of Completion

## Summary
Successfully created Tencent Cloud COS (Cloud Object Storage) integration module at `lib/cos.ts` with full TypeScript support, error handling, and image processing capabilities.

## Files Created
- ✅ `lib/cos.ts` - Main COS integration module

## Dependencies Installed
- ✅ `cos-nodejs-sdk-v5` - Tencent Cloud COS SDK
- ✅ `uuid` - UUID generation for unique keys
- ✅ `@types/uuid` - TypeScript types for uuid

## Functions Implemented

### 1. COS Client Setup
- `createCosClient()` - Creates configured COS client from environment variables
- `cosClient` - Singleton client export for convenience
- Environment variables: `TENCENT_COS_SECRET_ID`, `TENCENT_COS_SECRET_KEY`, `TENCENT_COS_REGION`, `TENCENT_COS_BUCKET`

### 2. uploadImage
- Uploads image buffer to COS with private ACL
- Generates unique key using UUID + sanitized filename
- Returns key, signed URL, and ETag
- Error code: `UPLOAD_FAILED`

### 3. getImageUrl
- Generates signed URL with configurable expiration (default 1 hour)
- Supports thumbnail sizes: `small` (400px), `medium` (800px), `original`
- Appends COS image processing parameters for thumbnails
- Error code: `URL_GENERATION_FAILED`

### 4. deleteImage
- Deletes single image by key
- Error code: `DELETE_FAILED`

### 5. generateThumbnailUrl
- Generates COS imageMogr2 processing URL suffix
- `small`: `?imageMogr2/thumbnail/400x`
- `medium`: `?imageMogr2/thumbnail/800x`
- `original`: no processing

## Additional Functions (Bonus)

### 6. deleteImagesBatch
- Batch delete up to 1000 images per request (COS limit)
- Returns deleted keys and errors separately
- Error code: `BATCH_DELETE_FAILED`

### 7. imageExists
- Check if image exists by key
- Returns boolean, handles 404 gracefully
- Error code: `HEAD_FAILED`

### 8. getImageMetadata
- Retrieve image metadata (Content-Type, Content-Length, ETag, Last-Modified)
- Error code: `METADATA_FAILED`

## TypeScript Types

```typescript
export type ImageSize = 'small' | 'medium' | 'original';

export interface UploadResult {
  key: string;
  url: string;
  etag: string;
}

export interface SignedUrlOptions {
  expires?: number;  // default: 3600 (1 hour)
  size?: ImageSize;  // default: 'original'
}
```

## Error Handling

Custom `CosError` class with:
- `message`: Human-readable error message
- `code`: Error code for programmatic handling
- `originalError`: Original error from COS SDK

Error codes:
- `MISSING_SECRET_ID` - TENCENT_COS_SECRET_ID not set
- `MISSING_SECRET_KEY` - TENCENT_COS_SECRET_KEY not set
- `MISSING_REGION` - TENCENT_COS_REGION not set
- `MISSING_BUCKET` - TENCENT_COS_BUCKET not set
- `UPLOAD_FAILED` - Image upload failed
- `URL_GENERATION_FAILED` - Signed URL generation failed
- `DELETE_FAILED` - Image deletion failed
- `BATCH_DELETE_FAILED` - Batch deletion failed
- `BATCH_DELETE_ERROR` - Individual item deletion error
- `HEAD_FAILED` - Head request failed
- `METADATA_FAILED` - Metadata retrieval failed

## Security Features
- ✅ Credentials from environment variables only (no hardcoding)
- ✅ Images stored with `private` ACL (requires signed URL)
- ✅ Signed URLs with configurable expiration
- ✅ SecretId/SecretKey never exposed in code

## Build Verification
- ✅ TypeScript compilation successful (`npx tsc --noEmit`)
- No errors or warnings

## Usage Example

```typescript
import { uploadImage, getImageUrl, deleteImage } from '@/lib/cos';

// Upload
const result = await uploadImage(buffer, 'photo.jpg', 'image/jpeg');
console.log(result.key, result.url);

// Get signed URL with thumbnail
const smallUrl = await getImageUrl(result.key, { size: 'small', expires: 7200 });

// Delete
await deleteImage(result.key);
```
