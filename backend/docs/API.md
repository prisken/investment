# Investment App Backend API Documentation

## Overview

The Investment App Backend provides a comprehensive RESTful API for managing investment portfolios, market data, and user authentication. This API is designed to handle both US and Hong Kong stock market data with real-time updates and secure user management.

## Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true/false,
  "data": {...},
  "message": "Success/error message",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## Error Handling

Errors are returned with appropriate HTTP status codes and detailed error messages:

```json
{
  "success": false,
  "error": {
    "message": "Detailed error description",
    "code": "ERROR_CODE"
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## Rate Limiting

- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 5 requests per 15 minutes  
- **API endpoints**: 1000 requests per 15 minutes

---

## Health Check Endpoints

### GET /health

Get overall system health status.

**Response:**
```json
{
  "status": "OK",
  "message": "Investment App Backend is running",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "environment": "development",
  "database": {
    "status": "healthy",
    "timestamp": "2025-01-01T00:00:00.000Z"
  },
  "uptime": 123.45
}
```

### GET /health/db

Get database health status specifically.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "environment": "development"
}
```

---

## Authentication Endpoints

### POST /api/auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "preferences": {},
    "subscription": {
      "plan": "free",
      "features": []
    },
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  },
  "message": "User created successfully"
}
```

### POST /api/auth/login

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Authentication successful"
}
```

### POST /api/auth/logout

Logout user (client-side token removal).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET /api/auth/profile

Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "preferences": {},
    "subscription": {
      "plan": "free",
      "features": []
    }
  },
  "message": "Profile retrieved successfully"
}
```

### PUT /api/auth/profile

Update user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Smith",
  "preferences": {
    "notifications": true,
    "darkMode": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Smith",
    "preferences": {
      "notifications": true,
      "darkMode": false
    }
  },
  "message": "Profile updated successfully"
}
```

### GET /api/auth/verify

Verify JWT token validity.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "valid": true
  },
  "message": "Token is valid"
}
```

---

## Market Data Endpoints

### GET /api/market/overview

Get market overview for both US and HK markets.

**Response:**
```json
{
  "success": true,
  "data": {
    "usMarket": {
      "status": "open",
      "lastUpdated": "2025-01-01T00:00:00.000Z",
      "indices": ["S&P 500", "Dow Jones", "NASDAQ"]
    },
    "hkMarket": {
      "status": "closed",
      "lastUpdated": "2025-01-01T00:00:00.000Z",
      "indices": ["Hang Seng", "Hang Seng Tech"]
    },
    "globalStatus": "mixed"
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### GET /api/market/indices/us

Get US market indices data.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "symbol": "^GSPC",
      "name": "S&P 500",
      "price": 4500.25,
      "change": 12.50,
      "changePercent": 0.28,
      "market": "US",
      "lastUpdated": "2025-01-01T00:00:00.000Z"
    }
  ],
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### GET /api/market/indices/hk

Get Hong Kong market indices data.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "symbol": "^HSI",
      "name": "Hang Seng Index",
      "price": 18500.75,
      "change": -150.25,
      "changePercent": -0.81,
      "market": "HK",
      "lastUpdated": "2025-01-01T00:00:00.000Z"
    }
  ],
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### GET /api/market/status

Get current market status.

**Response:**
```json
{
  "success": true,
  "data": {
    "usMarket": "open",
    "hkMarket": "closed",
    "lastUpdated": "2025-01-01T00:00:00.000Z"
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

## Stock Data Endpoints

### GET /api/stocks/quote/:symbol

Get real-time stock quote for a specific symbol.

**Parameters:**
- `symbol`: Stock symbol (e.g., AAPL, 0700)

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "price": 150.25,
    "change": 2.50,
    "changePercent": 1.69,
    "volume": 50000000,
    "marketCap": 2500000000000,
    "pe": 25.5,
    "dividend": 0.88,
    "dayHigh": 151.00,
    "dayLow": 148.50,
    "open": 149.00,
    "previousClose": 147.75,
    "market": "US",
    "lastUpdated": "2025-01-01T00:00:00.000Z"
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### GET /api/stocks/search

Search for stocks by name or symbol.

**Query Parameters:**
- `q`: Search query
- `market`: Market filter (US, HK, or both)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "market": "US",
      "exchange": "NASDAQ"
    }
  ],
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

## Portfolio Management Endpoints

### GET /api/portfolio

Get user's portfolio summary.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "My Portfolio",
    "totalValue": 50000.00,
    "totalChange": 2500.00,
    "totalChangePercent": 5.26,
    "holdings": [
      {
        "symbol": "AAPL",
        "shares": 100,
        "avgPrice": 145.00,
        "currentPrice": 150.25,
        "currentValue": 15025.00,
        "change": 525.00,
        "changePercent": 3.62
      }
    ]
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### POST /api/portfolio/transaction

Record a new transaction.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "type": "buy",
  "symbol": "AAPL",
  "shares": 10,
  "price": 150.00,
  "market": "US"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "type": "buy",
    "symbol": "AAPL",
    "shares": 10,
    "price": 150.00,
    "total": 1500.00,
    "timestamp": "2025-01-01T00:00:00.000Z"
  },
  "message": "Transaction recorded successfully"
}
```

---

## Admin Endpoints

### GET /api/auth/users

Get all users (admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Query Parameters:**
- `limit`: Number of users to return (default: 100)
- `offset`: Number of users to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

### PUT /api/auth/users/:id/deactivate

Deactivate a user account (admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "is_active": false
  },
  "message": "User deactivated successfully"
}
```

---

## Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | BAD_REQUEST | Invalid request data |
| 401 | UNAUTHORIZED | Authentication required |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource already exists |
| 429 | TOO_MANY_REQUESTS | Rate limit exceeded |
| 500 | INTERNAL_SERVER_ERROR | Server error |

---

## WebSocket Endpoints

### Market Data Stream

```
ws://localhost:3000/ws/market
```

Subscribe to real-time market data updates:

```json
{
  "action": "subscribe",
  "symbols": ["AAPL", "GOOGL", "^GSPC"]
}
```

---

## Testing

The API includes comprehensive test coverage. Run tests with:

```bash
npm test
npm run test:coverage
```

---

## Rate Limiting Headers

Rate limiting information is included in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- CORS protection
- Helmet security headers
- Input validation and sanitization
- SQL injection protection
- XSS protection

---

## Support

For API support and questions, please contact the development team or refer to the project documentation.
