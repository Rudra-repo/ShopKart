# ShopKart 🛍️

A modern, responsive full-stack e-commerce web application featuring a luxury dark monochrome aesthetic, real-time cart & wishlist management, dynamic order tracking with delivery status progression, and integrated Razorpay payment gateway checkout.

---

## 📁 Project Architecture & Structure

The project is cleanly decoupled into two independent, production-ready modules: **`backend`** and **`frontend`**.

```text
ShopKart/
├── backend/
│   ├── config/
│   │   └── razorpay.js        # Razorpay SDK configuration
│   ├── controllers/
│   │   ├── cart.controller.js
│   │   ├── customer.controller.js
│   │   ├── order.controller.js
│   │   ├── product.controller.js
│   │   └── wishlist.controller.js
│   ├── middlewares/
│   │   └── auth.middleware.js # JWT validation (cookie & Bearer header)
│   ├── models/
│   │   ├── customer.model.js
│   │   ├── order.model.js
│   │   └── product.model.js
│   ├── routes/
│   │   ├── cart.routes.js
│   │   ├── customer.routes.js
│   │   ├── order.routes.js
│   │   ├── product.routes.js
│   │   └── wishlist.routes.js
│   ├── utils/
│   │   └── generateToken.js
│   ├── index.js               # Express API entry point (port 8082)
│   └── package.json           # Backend dependencies & scripts
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   └── SearchBar.jsx
│   │   ├── context/
│   │   │   └── CartContext.jsx  # Global cart state
│   │   ├── pages/
│   │   │   ├── Cart.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── OrderSuccess.jsx
│   │   │   ├── ProductDetails.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Wishlist.jsx
│   │   ├── services/
│   │   │   └── api.js           # Central Axios HTTP service
│   │   ├── App.jsx
│   │   ├── index.css            # Dark theme design tokens & styles
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json           # Frontend dependencies & Vite scripts
│   └── vite.config.js
│
├── .gitignore
├── package.json               # Root convenience runner
└── README.md
```

---

## 🌟 Key Features

### 1. Luxury Monochrome Design & Full Responsiveness
- Dark velvet aesthetic (`#0c0d0e`) with frosted glassmorphism and emerald green brand accents (`#10b981`).
- Responsive layouts customized for Mobile, Tablet, and Desktop with a slide-out drawer menu for mobile screens.

### 2. Product Browsing, Filtering & Auto-Seeding
- Real-time instant search by product title.
- Multi-category filter buttons (Electronics, Fashion, Books, Home).
- Price sorting (Low-to-High, High-to-Low).
- Self-healing database: automatically populates default sample products if the database is freshly initialized.

### 3. Cart & Wishlist Management
- Instant wishlist toggle with notification feedback.
- Real-time cart badge counter in the navigation bar.
- Stock decrement validation, increment/decrement controls, and item removal.
- One-click migration of wishlist items into the cart.

### 4. Checkout & Payment Gateway Integration
- **Razorpay** checkout integration with cryptographic HMAC-SHA256 signature verification.
- Built-in instant test simulator for offline or rapid end-to-end payment testing.

### 5. Orders & Visual Delivery Progression
- Customer order history with complete delivery address and item breakdown.
- Delivery timeline progression: `Order Placed` → `Processing` → `Shipped` → `Delivered`.
- Pending payment retry button for orders interrupted during payment.

### 6. Secure Authentication
- JWT (JSON Web Token) authentication with `bcryptjs` password hashing.
- Dual token extraction: supports HttpOnly cookies and `Authorization: Bearer <token>` request headers.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Routing**: React Router DOM v7
- **Styling**: Vanilla CSS (Modular design tokens, glassmorphism, responsive flex/grid)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **HTTP Client**: Axios (with Bearer token interceptor)

### Backend
- **Runtime**: Node.js & Express 5
- **Database**: MongoDB & Mongoose ODM
- **Authentication**: JWT (`jsonwebtoken`) & `bcryptjs`
- **Payment Processing**: Official Razorpay Node SDK
- **Security**: CORS with credentials enabled, cookie-parser

---

## 🚀 Getting Started (Local Setup)

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: MongoDB running locally on `127.0.0.1:27017` or via a cloud connection string

---

### 2. Environment Variables Configuration
Copy the safe `.env.example` template to create your local `.env` (never commit your `.env`):
```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `8082` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/shopkart` |
| `JWT_SECRET` | Strong secret string used to sign JWTs | `your_super_secure_jwt_secret_here` |
| `RAZORPAY_KEY_ID` | Razorpay API Key ID (optional for local mock) | `your_razorpay_key_id` |
| `RAZORPAY_KEY_SECRET` | Razorpay API Secret (optional for local mock) | `your_razorpay_key_secret` |
| `NODE_ENV` | Environment mode | `development` |

> 💡 **Mock Payment Mode**: When Razorpay keys are omitted, ShopKart automatically operates in safe local mock mode, enabling seamless checkout and order placement via the built-in payment test simulator without needing live merchant credentials.

---

### 3. Setup the Backend

Open a terminal and navigate to the `backend` directory:
```bash
cd backend
npm install
```

Start the backend API server:
```bash
npm start
```
> The backend server will start on **`http://localhost:8082`**.  
> If using nodemon for automatic hot-reloading during development, run `npm run dev`.

---

### 3. Setup the Frontend

Open a second terminal window and navigate to the `frontend` directory:
```bash
cd frontend
npm install
```

Start the frontend development server:
```bash
npm run dev
```
> The frontend application will start on **`http://localhost:5173`**.

---

### 4. Convenient Root Scripts (Optional)

From the project root directory, you can also run both commands directly:
```bash
# Run backend server
npm run backend

# Run frontend development server
npm run frontend
```

---

## 📡 API Endpoints Reference

### Authentication
- `POST /api/customers/register` - Register a new customer
- `POST /api/customers/login` - Authenticate customer & set session token
- `GET /api/customers/me` - Get current authenticated user profile
- `POST /api/customers/logout` - Clear user session

### Products
- `GET /api/products` - List all products (`?search=`, `?category=`, `?sort=`)
- `GET /api/products/:id` - Get product details by ID
- `POST /api/products/seed` - Seed default products if empty

### Wishlist (Protected)
- `GET /api/wishlist` - Get customer's wishlist items
- `POST /api/wishlist/:productId` - Add product to wishlist
- `DELETE /api/wishlist/:productId` - Remove product from wishlist

### Cart (Protected)
- `GET /api/cart` - Get customer's cart
- `POST /api/cart/:productId` - Add item to cart
- `PATCH /api/cart/:productId` - Update item quantity
- `DELETE /api/cart/:productId` - Remove item from cart

### Orders & Payments (Protected)
- `POST /api/orders/create-payment-order` - Create Razorpay order
- `POST /api/orders/verify-payment` - Cryptographically verify payment & finalize order
- `GET /api/orders` - Get customer's order history
- `GET /api/orders/:id` - Get single order details
- `POST /api/orders/:id/pay` - Retry payment for pending order

---

## 🔒 Security & Privacy

- **Zero Secret Exposure**: `.gitignore` strictly excludes all `.env` files and environment files from git tracking.
- **Password Security**: Passwords are salted and hashed using `bcryptjs` with 10 salt rounds.
- **HMAC Verification**: Razorpay payment signatures are validated on the server using cryptographic SHA256 before order confirmation.
- **Resilient Database**: Database connections implement fail-fast timeouts (`serverSelectionTimeoutMS: 5000`) preventing process hang on network issues.

---

## 📄 License
ISC License.
