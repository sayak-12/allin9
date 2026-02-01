# All@9 - Quick Start Guide

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The app will open at `http://localhost:5173/`

### 3. Configure Backend URL
Edit `.env` file:
```env
VITE_API_URL=http://localhost:3000
```

## 📱 Application Tabs

### 1. Take Order Tab
- View menu items from your backend
- Add items to cart by clicking "Add"
- Adjust quantities using +/− buttons
- Remove individual items or clear entire cart
- Click "Place Order" to submit

### 2. Order History Tab
- View all past orders
- Filter by:
  - **Today** - Orders from today
  - **This Week** - Orders from current week
  - **This Month** - Orders from current month
  - **Custom Range** - Select custom date range
- See consolidated metrics:
  - Total Sales amount
  - Number of Orders
  - Average Order Value

### 3. Admin Tab
- **Add Menu Items:**
  - Enter item name (required)
  - Enter price in rupees (required)
  - Add optional description
  - Click "Add Item to Menu"
- **View Current Menu** - See all available items

## 🔑 Authentication

- Login requires **Mobile Number** and **Password**
- For demo/testing, any mobile number and password combination works
- Your session is saved automatically (JWT token in localStorage)
- Click **Logout** button in header to clear session

## 💾 Data Persistence

- **Cart**: Automatically saved to browser storage
  - Persists when you refresh the page
  - Clears only after successful order submission
  
- **Authentication**: JWT token stored locally
  - Remains until you logout
  - Automatically attached to all API requests

## 📦 Backend API Requirements

Your backend needs to handle:

1. **POST /login**
   - Accept mobile number & password
   - Return JWT token

2. **GET /fetchmenu**
   - Return list of menu items with name, price, description

3. **POST /addToMenu** (Protected)
   - Accept item details
   - Add to menu

4. **POST /addToSales** (Protected)
   - Accept order items and total amount
   - Record the sale
   - Return success response

5. **GET /getSalesHistory** (Optional)
   - Return order history

## 🎨 Theme

The app uses a **Purple Theme**:
- Primary color: Purple (#9333ea)
- Gradients: From purple-600 to purple-700
- All UI elements use Tailwind CSS utility classes

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't login | Verify backend `/login` endpoint is working |
| Menu not showing | Check `/fetchmenu` endpoint, verify data format |
| Orders not saving | Confirm `/addToSales` endpoint exists and is protected |
| Cart keeps clearing | Check localStorage permissions in browser |
| 404 errors | Verify `VITE_API_URL` in .env matches your backend |

## 📝 Notes

- All prices are in Rupees (₹)
- Order IDs are auto-generated with timestamp + random string
- Cart items shown with individual and total amounts
- Each cart item can have quantity up to any number (1+)
- Orders clear automatically only after backend confirms success

## 🔄 Development Workflow

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run linter
npm run lint
```

## ✅ Features Checklist

- ✓ User authentication with JWT
- ✓ Dynamic menu from backend
- ✓ Shopping cart with quantity management
- ✓ Order placement with auto-clear on success
- ✓ Order history with date filters
- ✓ Sales analytics (total, count, average)
- ✓ Admin panel to add menu items
- ✓ LocalStorage persistence
- ✓ Responsive UI with Tailwind
- ✓ Protected routes
- ✓ Error handling & user feedback

Enjoy! 🎉
