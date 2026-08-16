# Daily Expenses API Documentation

## Overview
The Daily Expenses feature tracks daily expenses for inflow/outflow comparison. Each expense is recorded with a price, description, who paid it (givenBy), and the date.

## API Endpoints

### 1. Add Daily Expense
**POST** `/addDailyExpense`

**Description:** Creates a new daily expense entry.

**Request Body:**
```json
{
  "price": 150.50,
  "description": "Grocery items - vegetables and rice",
  "givenBy": "shop_cash",
  "date": "2024-08-16"
}
```

**Parameters:**
- `price` (number, required): Expense amount. Must be positive.
- `description` (string, required): Details about the expense (max 500 chars recommended).
- `givenBy` (enum, required): Who paid the expense. Options: `sayan`, `sayak`, `dipu`, `pratick`, `shop_cash`
- `date` (string, required): Date in YYYY-MM-DD format.

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Expense added successfully",
  "data": {
    "_id": "64a1f2c3d4e5f6g7h8i9j0k1",
    "price": 150.50,
    "description": "Grocery items - vegetables and rice",
    "givenBy": "shop_cash",
    "date": "2024-08-16",
    "createdAt": "2024-08-16T10:30:45.123Z",
    "updatedAt": "2024-08-16T10:30:45.123Z"
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Invalid price or missing required fields"
}
```

---

### 2. Get Daily Expenses
**GET** `/getDailyExpenses`

**Description:** Retrieves daily expenses with optional filtering.

**Query Parameters (Optional):**
- `date` (string): Filter by specific date in YYYY-MM-DD format.
- `givenBy` (string): Filter by who paid (sayan, sayak, dipu, pratick, shop_cash).

**Example Requests:**
- `/getDailyExpenses` - Get all expenses
- `/getDailyExpenses?date=2024-08-16` - Get expenses for specific date
- `/getDailyExpenses?givenBy=shop_cash` - Get expenses paid by shop cash
- `/getDailyExpenses?date=2024-08-16&givenBy=sayan` - Combined filters

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64a1f2c3d4e5f6g7h8i9j0k1",
      "price": 150.50,
      "description": "Grocery items - vegetables and rice",
      "givenBy": "shop_cash",
      "date": "2024-08-16",
      "createdAt": "2024-08-16T10:30:45.123Z",
      "updatedAt": "2024-08-16T10:30:45.123Z"
    },
    {
      "_id": "64a1f2c3d4e5f6g7h8i9j0k2",
      "price": 200.00,
      "description": "Supplier payment",
      "givenBy": "sayak",
      "date": "2024-08-16",
      "createdAt": "2024-08-16T11:15:30.456Z",
      "updatedAt": "2024-08-16T11:15:30.456Z"
    }
  ]
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Invalid filter parameters"
}
```

---

### 3. Update Daily Expense
**PUT** `/updateDailyExpense/:id`

**Description:** Updates an existing daily expense entry.

**URL Parameters:**
- `id` (string, required): MongoDB ObjectId of the expense.

**Request Body (All fields optional):**
```json
{
  "price": 175.75,
  "description": "Updated grocery items - vegetables, rice and oil",
  "givenBy": "sayak",
  "date": "2024-08-16"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Expense updated successfully",
  "data": {
    "_id": "64a1f2c3d4e5f6g7h8i9j0k1",
    "price": 175.75,
    "description": "Updated grocery items - vegetables, rice and oil",
    "givenBy": "sayak",
    "date": "2024-08-16",
    "createdAt": "2024-08-16T10:30:45.123Z",
    "updatedAt": "2024-08-16T12:45:20.789Z"
  }
}
```

**Response (Error - 404):**
```json
{
  "success": false,
  "message": "Expense not found"
}
```

---

### 4. Delete Daily Expense
**DELETE** `/deleteDailyExpense/:id`

**Description:** Deletes a daily expense entry.

**URL Parameters:**
- `id` (string, required): MongoDB ObjectId of the expense to delete.

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Expense deleted successfully"
}
```

**Response (Error - 404):**
```json
{
  "success": false,
  "message": "Expense not found"
}
```

---

## Database Schema

**Collection:** `daily_expenses`

```javascript
{
  _id: ObjectId,
  price: Number,                    // Expense amount (decimal)
  description: String,              // Expense details
  givenBy: String,                  // Enum: sayan, sayak, dipu, pratick, shop_cash
  date: String,                     // Date in YYYY-MM-DD format
  createdAt: Date,                  // Auto-generated timestamp
  updatedAt: Date,                  // Auto-generated timestamp
}
```

**Indexes (Recommended):**
```javascript
// For faster filtering
db.daily_expenses.createIndex({ date: 1 })
db.daily_expenses.createIndex({ givenBy: 1 })
db.daily_expenses.createIndex({ date: 1, givenBy: 1 })  // Compound index
db.daily_expenses.createIndex({ createdAt: -1 })        // For sorting by newest
```

---

## Frontend Usage

The frontend component (`DailyExpenses`) provides:
- Form to add expenses with automatic date defaulting to today
- Display of today's total expenses
- Breakdown by person (givenBy)
- List of today's expenses with delete functionality
- Real-time validation and error messages

## Authentication

All endpoints require Bearer token authentication (JWT) in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Notes

1. **Date Format:** Always use YYYY-MM-DD format for dates.
2. **Price Validation:** Ensure price is positive and not zero.
3. **Description:** Should be concise but descriptive (50-200 characters ideal).
4. **Error Handling:** Return appropriate HTTP status codes:
   - 201 for successful creation
   - 200 for successful update/retrieval
   - 400 for bad requests
   - 404 for not found
   - 500 for server errors
5. **Soft Delete (Optional):** Consider implementing soft delete by adding an `isDeleted` field if you need to maintain expense records for auditing.
