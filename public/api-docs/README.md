# FreePic API Documentation

## Overview

FreePic provides a REST API for programmatic access to our copyright-free image collection. This API is designed to be AI-agent friendly with clear endpoints, structured responses, and comprehensive documentation.

## Base URL

```
http://localhost:9000/api
```

## Authentication

Most endpoints are public. Authentication is required for:

- Uploading images
- User profile management
- Admin operations

Authentication uses JWT tokens passed in the `Authorization` header:

```
Authorization: Bearer <token>
```

## Rate Limiting

- Public endpoints: 100 requests per minute per IP
- Authenticated endpoints: 1000 requests per minute per user

## Content Types

All endpoints accept and return `application/json` unless otherwise specified.

## Endpoints

### Images

#### List Images

```http
GET /api/images?page=1&limit=20
```

Returns a paginated list of approved images.

**Query Parameters:**

- `page` (integer, optional): Page number, default 1
- `limit` (integer, optional): Items per page (max 100), default 20
- `q` (string, optional): Search query
- `camera` (string, optional): Filter by camera model
- `userId` (string, optional): Filter by user ID

**Response:**

```json
{
  "images": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### Get Image Details

```http
GET /api/images/{id}
```

Returns detailed information about a specific image.

### Search

#### Keyword Search

```http
GET /api/search?q=landscape&page=1&limit=20
```

Search images by keywords.

#### Semantic Search

```http
POST /api/search/semantic
Content-Type: application/json

{
  "query": "sunset over mountains with golden light"
}
```

Natural language image search using AI embeddings.

#### Visual Search

```http
POST /api/search/visual
Content-Type: multipart/form-data

image: <file>
```

Find similar images by uploading an image.

### Users

#### Get User Profile

```http
GET /api/users/{id}
```

Get public profile information for a user.

#### Get User Uploads

```http
GET /api/users/{id}/uploads
```

Get images uploaded by a specific user.

### System

#### List Tags

```http
GET /api/tags
```

Get available camera models for filtering.

## Image Object Schema

```json
{
  "id": "uuid-string",
  "url": "https://...",
  "thumbnailUrl": "https://.../thumb",
  "smallUrl": "https://.../small",
  "regularUrl": "https://.../regular",
  "fullUrl": "https://.../full",
  "width": 1920,
  "height": 1080,
  "author": "Photographer Name",
  "userId": "uuid-string",
  "camera": "Sony A7III",
  "likes": 42,
  "downloads": 128,
  "createdAt": "2024-03-09T12:00:00Z",
  "blurHash": "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
  "dominantColor": "#8B7355"
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "details": "Additional details (optional)"
}
```

Common HTTP status codes:

- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## OpenAPI Specification

Complete OpenAPI 3.0 spec available at:

- JSON: `/api-docs/openapi.json`

## AI Agent Guidelines

1. **Use semantic search** for natural language queries
2. **Respect rate limits** - add delays between requests
3. **Handle pagination** - don't request all pages at once
4. **Cache results** when appropriate
5. **Attribute images** even though not required

## Support

For API support:

- Email: dev@freepic.com
- Documentation: https://freepic.com/docs

## License

API usage is free for both personal and commercial projects.
Images are copyright-free and can be used without attribution.
