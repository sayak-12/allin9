# All@9 - API Documentation

## Backend API Contracts

This document describes the API endpoints your backend must implement for the All@9 application.

## Base URL
```
http://localhost:3000  (configurable via VITE_API_URL environment variable)
```

## Authentication
All endpoints marked as **(Protected)** require the JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Endpoints

### 1. Authentication

#### POST `/login`
User login endpoint.

**Request:**
```json
{
  "mobileNumber": "9876543210",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Invalid credentials"
}
```

**Notes:**
- Mobile number can be any string
- Password can be any string
- For demo purposes, you can accept any credentials
- Token will be stored in localStorage with key "token"
- Token will be automatically sent in subsequent requests

---

### 2. Menu Management

#### GET `/fetchmenu`
Fetch all available menu items.

**Request:**
```
GET /fetchmenu
```

**Response (200 OK):**
```json
[
  {
    "id": "1",
    "name": "Butter Chicken",
    "price": 250,
    "description": "Creamy tomato-based curry with tender chicken pieces"
  },
  {
    "id": "2",
    "name": "Biryani",
    "price": 180,
    "description": "Fragrant rice dish with meat and spices"
  },
  {
    "id": "3",
    "name": "Samosa",
    "price": 30
  }
]
```

**Response Format:**
```typescript
interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;  // Optional
}
```

**Notes:**
- `id` must be unique
- `price` must be a positive number
- `description` is optional
- Returns empty array if no items exist

---

#### POST `/addToMenu` **(Protected)**
Add a new item to the menu.

**Request:**
```json
{
  "name": "Tandoori Chicken",
  "price": 320,
  "description": "Grilled chicken marinated in yogurt and spices"
}
```

**Response (201 Created):**
```json
{
  "id": "5",
  "name": "Tandoori Chicken",
  "price": 320,
  "description": "Grilled chicken marinated in yogurt and spices"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Name and price are required"
}
```

**Notes:**
- Requires valid JWT token in Authorization header
- Name and price are required
- Description is optional
- Should return the created item with an id
- Price should be validated as positive number

---

### 3. Sales Management

#### POST `/addToSales` **(Protected)**
Record a new sale/order.

**Request:**
```json
{
  "items": [
    {
      "id": "1",
      "name": "Butter Chicken",
      "price": 250,
      "quantity": 2,
      "description": "Creamy tomato-based curry with tender chicken pieces"
    },
    {
      "id": "3",
      "name": "Samosa",
      "price": 30,
      "quantity": 3,
      "description": null
    }
  ],
  "totalAmount": 590
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "orderID": "ORD-1707000123456-ABC123DEF"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Invalid order data"
}
```

**Notes:**
- Requires valid JWT token
- Items array must not be empty
- Each item must have: id, name, price, quantity
- totalAmount should be validated (price × quantity for each item)
- Generate or return a unique orderID
- Store the order in database for history

**Request Format:**
```typescript
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
}

interface AddToSalesRequest {
  items: OrderItem[];
  totalAmount: number;
}
```

---

#### GET `/getSalesHistory` **(Protected)** (Optional)
Fetch sales/order history with optional filters.

**Request:**
```
GET /getSalesHistory
GET /getSalesHistory?startDate=2024-01-15&endDate=2024-01-20
```

**Query Parameters:**
- `startDate` (optional): YYYY-MM-DD format, filter orders from this date
- `endDate` (optional): YYYY-MM-DD format, filter orders until this date

**Response (200 OK):**
```json
[
  {
    "id": "order-123",
    "orderID": "ORD-1707000123456-ABC123DEF",
    "items": [
      {
        "id": "1",
        "name": "Butter Chicken",
        "price": 250,
        "quantity": 2
      }
    ],
    "totalAmount": 500,
    "createdAt": "2024-01-20T15:30:00Z"
  }
]
```

**Response Format:**
```typescript
interface Order {
  id: string;
  orderID: string;
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;  // ISO timestamp
}
```

**Notes:**
- Requires valid JWT token
- Optional endpoint (frontend can work without it)
- If not implemented, return empty array
- `createdAt` should be ISO timestamp (e.g., "2024-01-20T15:30:00Z")

---

## Error Handling

All endpoints should follow standard HTTP status codes:

| Code | Meaning | When to Use |
|------|---------|-----------|
| 200 | OK | Successful GET/POST |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid JWT token |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Unexpected server error |

**Standard Error Response:**
```json
{
  "error": "Error description"
}
```

---

## JWT Token Structure

The JWT token should contain claims that identify the user:

```json
{
  "sub": "user-id",
  "mobileNumber": "9876543210",
  "iat": 1704067200,
  "exp": 1704153600
}
```

**Notes:**
- Token should have reasonable expiration time (e.g., 24 hours)
- Frontend stores token in localStorage
- Token is automatically sent in Authorization header for all protected endpoints

---

## Example Implementation Notes

### For Authentication
```javascript
// Check if user exists or create demo account
// Generate JWT token
// Return token in response
```

### For Menu Operations
```javascript
// Store items in database or in-memory array
// Each item needs unique ID
// Support CRUD operations
```

### For Sales
```javascript
// Validate order data
// Store order with timestamp
// Return confirmation
// For history, filter by date range if provided
```

---

## Testing the API

You can test these endpoints using cURL or Postman:

```bash
# Login
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210","password":"pass"}'

# Get token from response, then:

# Fetch menu
curl http://localhost:3000/fetchmenu

# Add to menu (requires token)
curl -X POST http://localhost:3000/addToMenu \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Pizza","price":200}'

# Add sale (requires token)
curl -X POST http://localhost:3000/addToSales \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[...],"totalAmount":500}'
```

---

## CORS Configuration

Make sure your backend allows CORS from the frontend:
- **Origin**: `http://localhost:5173` (or your frontend URL)
- **Methods**: GET, POST
- **Headers**: Content-Type, Authorization

```javascript
// Express example
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true
}));
```

---

## Rate Limiting (Optional)

Consider implementing rate limiting for security:
- Login endpoint: 5 requests per 15 minutes
- Other endpoints: No strict limit needed for demo

---

## Data Validation

Always validate incoming data:

```
✓ Name: non-empty string, max 100 chars
✓ Price: positive number, max 2 decimal places
✓ Quantity: positive integer
✓ Total Amount: positive number
✓ Mobile Number: string, non-empty
✓ Password: string, non-empty
```

---

Questions? Check the main README.md or QUICKSTART.md
