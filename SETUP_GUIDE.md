# All@9 - Food Cart Management System

A React + Tailwind CSS application for managing food cart sales orders with admin capabilities.

## Features

- **User Authentication**: Mobile number & password-based login with JWT token persistence
- **Order Management**: Take orders from a dynamic menu with real-time cart management
- **Menu Management**: Admin panel to add items to the menu dynamically
- **Order History**: Comprehensive order tracking with filters (Today, This Week, This Month, Custom Date Range)
- **Sales Analytics**: View consolidated sales data, total orders, and average order value
- **Cart Persistence**: Orders are saved to localStorage and persist across page refreshes
- **Purple Theme**: Modern, cohesive UI with purple color scheme

## Tech Stack

- **Frontend Framework**: React 19.2 with TypeScript
- **Styling**: Tailwind CSS v4 with Vite integration
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Build Tool**: Vite

## Project Structure

```
src/
├── components/        # React components
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Menu.tsx
│   ├── Cart.tsx
│   ├── OrderHistory.tsx
│   ├── Admin.tsx
│   └── index.ts
├── context/          # React Context for state management
│   ├── AuthContext.tsx
│   ├── AuthContextProvider.ts
│   └── useAuth.ts
├── services/         # API service layer
│   └── api.ts
├── types/            # TypeScript type definitions
│   └── index.ts
├── App.tsx          # Main App component with routing
├── App.css          # Global styles
├── main.tsx         # Entry point
└── index.css        # Base Tailwind imports
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd All@9
```

2. Install dependencies:
```bash
npm install
```

3. Configure API URL:
Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:3000
```

### Running the Application

**Development Mode:**
```bash
npm run dev
```
The application will be available at `http://localhost:5173/`

**Production Build:**
```bash
npm run build
```

**Preview Production Build:**
```bash
npm run preview
```

**Linting:**
```bash
npm run lint
```

## API Endpoints Required

The backend should implement the following endpoints:

### Authentication
- **POST** `/login` - User login
  - Request: `{ mobileNumber: string, password: string }`
  - Response: `{ token: string }`

### Menu Management
- **GET** `/fetchmenu` - Fetch all menu items
  - Response: `MenuItem[]`
- **POST** `/addToMenu` - Add a new menu item (requires authentication)
  - Request: `{ name: string, price: number, description?: string }`
  - Response: `MenuItem`

### Sales Management
- **POST** `/addToSales` - Record a new sale/order (requires authentication)
  - Request: `{ items: CartItem[], totalAmount: number }`
  - Response: `{ success: boolean, orderID: string }`
- **GET** `/getSalesHistory` - Fetch sales history (optional filters)
  - Query Params: `startDate`, `endDate`
  - Response: `Order[]`

## Component Documentation

### Login
- Handles user authentication
- Stores JWT token in localStorage
- Redirects to dashboard on successful login

### Dashboard
- Main application layout with three tabs
- Manages cart state and localStorage persistence
- Handles order placement

### Menu
- Displays available menu items
- Shows item name, price, and description
- Add to cart functionality

### Cart
- Shows items in current order
- Quantity adjustment with +/- buttons
- Remove item and clear cart options
- Place order functionality

### OrderHistory
- Displays all past orders
- Filter options: Today, This Week, This Month, Custom Date Range
- Shows consolidated sales metrics (total sales, number of orders, average order value)
- Displays order details with items and amounts

### Admin
- Add new items to menu
- View current menu items
- Requires menu refresh to see new items in order-taking section

## Authentication

- JWT tokens are stored in localStorage with key: `token`
- Tokens are automatically added to request headers via axios interceptor
- Protected routes redirect unauthenticated users to login

## Cart Persistence

- Cart items are stored in localStorage with key: `cart`
- Cart persists across page refreshes
- Cart automatically clears after successful order placement

## Theming

The application uses a purple color scheme defined in Tailwind classes:
- Primary Purple: `#9333ea` (from-purple-600)
- Dark Purple: `#7e22ce` (to-purple-700)
- Light Purple: `#c084fc` (primary-light)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| VITE_API_URL | http://localhost:3000 | Backend API base URL |

## Development Notes

- The application uses TypeScript with strict type checking
- Tailwind v4 is configured with proper utilities
- All API calls include JWT token in Authorization header
- React Router is used for navigation and protected routes
- Context API is used for authentication state management

## Troubleshooting

**CORS Issues**: If you encounter CORS errors, ensure your backend is configured to accept requests from `http://localhost:5173`

**API Connection**: Verify the `VITE_API_URL` environment variable matches your backend URL

**Token Issues**: Clear localStorage and login again if authentication seems broken

## License

MIT
