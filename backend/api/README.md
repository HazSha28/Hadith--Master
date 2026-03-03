# Hadith Master API

An open-source RESTful API for accessing authentic Hadith collections from the six canonical books (Kutub al-Sittah).

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start API server
npm run api

# Server runs on http://localhost:3001
```

## 📚 API Endpoints

### Base URL
```
http://localhost:3001/api/hadith
```

### Available Endpoints

#### 1. Get All Hadiths
```
GET /api/hadith
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `book` (string): Filter by book name
- `category` (string): Filter by category
- `difficulty` (string): Filter by difficulty level
- `tags` (string): Filter by tags (comma-separated)
- `search` (string): Search in text, narrator, or tags

**Example:**
```bash
GET /api/hadith?page=1&limit=10&book=Sahih%20Bukhari&category=general
```

#### 2. Get Specific Hadith
```
GET /api/hadith/:id
```

**Example:**
```bash
GET /api/hadith/abc123
```

#### 3. Search Hadiths
```
GET /api/hadith/search
```

**Query Parameters:**
- `q` (string, required): Search query
- `book` (string): Filter by book
- `category` (string): Filter by category
- `difficulty` (string): Filter by difficulty
- `narrator` (string): Filter by narrator
- `tags` (string): Filter by tags
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)

**Example:**
```bash
GET /api/hadith/search?q=prayer&category=general&limit=5
```

#### 4. Get Random Hadiths
```
GET /api/hadith/random
```

**Query Parameters:**
- `count` (number): Number of random hadiths (default: 1, max: 10)

**Example:**
```bash
GET /api/hadith/random?count=3
```

#### 5. Get Books
```
GET /api/hadith/books
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "sahih-bukhari",
      "name": "Sahih Bukhari",
      "fullName": "Sahih al-Bukhari",
      "author": "Imam al-Bukhari",
      "totalHadiths": 7563,
      "description": "Most authentic collection of hadiths"
    }
  ],
  "message": "Retrieved 1 books"
}
```

#### 6. Get Categories
```
GET /api/hadith/categories
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "general",
      "name": "General",
      "description": "General guidance and teachings",
      "hadithCount": 1250
    }
  ],
  "message": "Retrieved 5 categories"
}
```

## 📊 Response Format

All responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "pagination": {  // For paginated endpoints
    "currentPage": 1,
    "totalPages": 10,
    "totalHadiths": 200,
    "limit": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for allowed origins
- **Security Headers**: Helmet.js protection
- **Request Logging**: All requests logged
- **Input Validation**: Comprehensive parameter validation

## 🛠️ Development

### Environment Variables
```bash
API_PORT=3001
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:3000
NODE_ENV=development
```

### Health Check
```
GET /health
```

### API Documentation
```
GET /api/docs
```

## 📝️ Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed error message"
}
```

### Common HTTP Status Codes
- `200`: Success
- `400`: Bad Request (validation error)
- `401`: Unauthorized
- `404`: Not Found
- `429`: Too Many Requests (rate limit)
- `500`: Internal Server Error

## 🌍 Usage Examples

### JavaScript/Fetch
```javascript
// Get all hadiths
const response = await fetch('http://localhost:3001/api/hadith?page=1&limit=10');
const data = await response.json();

// Search hadiths
const searchResponse = await fetch('http://localhost:3001/api/hadith/search?q=prayer');
const searchData = await searchResponse.json();

// Get random hadith
const randomResponse = await fetch('http://localhost:3001/api/hadith/random?count=3');
const randomData = await randomResponse.json();
```

### Python/Requests
```python
import requests

# Get hadiths
response = requests.get('http://localhost:3001/api/hadith', params={
    'page': 1,
    'limit': 10,
    'book': 'Sahih Bukhari'
})

# Search hadiths
search_response = requests.get('http://localhost:3001/api/hadith/search', params={
    'q': 'prayer',
    'category': 'general'
})
```

### cURL
```bash
# Get hadiths
curl -X GET "http://localhost:3001/api/hadith?page=1&limit=10"

# Search hadiths
curl -X GET "http://localhost:3001/api/hadith/search?q=prayer&category=general"

# Get random hadith
curl -X GET "http://localhost:3001/api/hadith/random?count=3"
```

## 📚 Data Sources

This API provides access to hadiths from the six canonical books:
1. **Sahih al-Bukhari** - Compiled by Imam al-Bukhari
2. **Sahih Muslim** - Compiled by Imam Muslim
3. **Sunan Abu Dawud** - Compiled by Imam Abu Dawud
4. **Sunan al-Tirmidhi** - Compiled by Imam al-Tirmidhi
5. **Sunan al-Nasa'i** - Compiled by Imam al-Nasa'i
6. **Sunan Ibn Majah** - Compiled by Imam Ibn Majah

## 🤝 Contributing

This is an open-source API. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

MIT License - Free to use, modify, and distribute.

## 🆘 Support

For issues and support:
- Create an issue in the repository
- Check the API documentation at `/api/docs`
- Review the health check at `/health`

---

**Made with ❤️ for the Muslim community**
