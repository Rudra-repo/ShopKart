# ShopKart 🛍️

A modern, responsive full-stack e-commerce web application with a luxury dark monochrome aesthetic, real-time cart & wishlist state management, visual order delivery progression tracking, and seamless Razorpay payment gateway integration.

---

## 🔗 Submission Links

- **GitHub Repository**: [https://github.com/Rudra-repo/ShopKart](https://github.com/Rudra-repo/ShopKart)
- **Live Deployment**: [https://shop-kart-flax.vercel.app](https://shop-kart-flax.vercel.app)
- **Live API Health Check**: [https://shop-kart-flax.vercel.app/api/health](https://shop-kart-flax.vercel.app/api/health)

---

## 🌟 Key Features

- **Luxury Monochrome Aesthetic**: Sleek dark velvet aesthetic (`#0c0d0e`), frosted glass cards, and crisp emerald-green accents (`#10b981`).
- **100% Responsive Design**: Tailored viewport layouts for Mobile, Tablet, and Desktop, featuring touch-friendly drawer navigation.
- **Dynamic Product Browsing**:
  - Instant client/server search filtering by product name.
  - Multi-category filtering (Electronics, Fashion, Books, Home).
  - Price sorting (Low to High, High to Low).
  - Automatic sample catalogue seeding on empty database start.
- **Cart & Wishlist Management**:
  - Dynamic navbar notification badges.
  - Real-time stock decrement, quantity adjustments, and removal.
  - Single-click add-to-cart from wishlist.
- **Checkout & Payment Gateway**:
  - Integrated **Razorpay** checkout with signature verification (`crypto` HMAC SHA256).
  - Built-in payment test simulator fallback for quick testing without test cards.
- **Order Tracking & Delivery Status**:
  - Customer order history with complete delivery address and items list.
  - Visual timeline (`Order Placed` → `Processing` → `Shipped` → `Delivered`).
  - Pending payment retry button for interrupted checkouts.
- **Secure Authentication**:
  - JWT-based authentication with bcryptjs password hashing.
  - Dual token support: HttpOnly cookies and `Authorization: Bearer <token>` headers for cross-origin reliability.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Routing**: React Router DOM v7
- **Styling**: Vanilla CSS (Modular design tokens, glassmorphism, responsive flex/grid)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **HTTP Client**: Axios (with base URL detection and Bearer token interceptor)

### Backend
- **Runtime**: Node.js & Express 5
- **Database**: MongoDB & Mongoose ODM
- **Authentication**: JSON Web Token (`jsonwebtoken`) & `bcryptjs`
- **Payment Processing**: Official Razorpay Node SDK
- **Deployment**: Vercel Serverless Functions (`/api/index.js` bridge)

---

## 📁 Project Structure

```text
ShopKart/
├── api/
│   └── index.js             # Vercel serverless function entry point
├── backend/
│   ├── config/
│   │   └── razorpay.js      # Razorpay instance configuration
│   ├── controllers/
│   │   ├── cart.controller.js
│   │   ├── customer.controller.js
│   │   ├── order.controller.js
│   │   ├── product.controller.js
│   │   └── wishlist.controller.js
│   ├── middlewares/
│   │   └── auth.middleware.js # Dual cookie + Bearer token validator
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
│   └── index.js             # Express server (local & serverless dual-mode)
├── src/
│   ├── components/
│   │   ├── ErrorBoundary.jsx
│   │   ├── Navbar.jsx
│   │   ├── ProductCard.jsx
│   │   └── SearchBar.jsx
│   ├── context/
│   │   └── CartContext.jsx  # Global cart state
│   ├── pages/
│   │   ├── Cart.jsx
│   │   ├── Checkout.jsx
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Orders.jsx
│   │   ├── OrderSuccess.jsx
│   │   ├── ProductDetails.jsx
│   │   ├── Products.jsx
│   │   ├── Register.jsx
│   │   └── Wishlist.jsx
│   ├── services/
│   │   └── api.js           # Centralized Axios API service
│   ├── App.jsx
│   ├── index.css            # Global stylesheet & design tokens
│   └── main.jsx
├── .env.example
├── package.json
├── vercel.json              # Vercel rewrites & function bundling
└── vite.config.js
```

---

## 🚀 Local Setup & Installation

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance running on `127.0.0.1:27017` or a MongoDB Atlas cloud URI.

### 2. Clone the Repository
```bash
git clone https://github.com/Rudra-repo/ShopKart.git
cd ShopKart
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Populate the values inside `.env`:
```env
PORT=8082
MONGO_URI=mongodb://127.0.0.1:27017/shopkart
JWT_SECRET=your_jwt_secret_here
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
```

### 5. Run the Application

Start the backend API server:
```bash
npm run server
```
*(Backend runs on `http://localhost:8082`)*

In a separate terminal, start the frontend development server:
```bash
npm run dev
```
*(Frontend runs on `http://localhost:5173`)*

---

## 📡 API Endpoints Reference

### Authentication
- `POST /api/customers/register` - Register a new customer
- `POST /api/customers/login` - Authenticate customer & set token
- `GET /api/customers/me` - Fetch authenticated customer profile
- `POST /api/customers/logout` - Clear auth session

### Products
- `GET /api/products` - List products (supports `?search=`, `?category=`, `?sort=`)
- `GET /api/products/:id` - Fetch single product by ID
- `POST /api/products/seed` - Seed default catalogue if empty

### Wishlist (Protected)
- `GET /api/wishlist` - Get customer's wishlist
- `POST /api/wishlist/:productId` - Add product to wishlist
- `DELETE /api/wishlist/:productId` - Remove product from wishlist

### Cart (Protected)
- `GET /api/cart` - Get customer's cart
- `POST /api/cart/:productId` - Add item to cart
- `PATCH /api/cart/:productId` - Update item quantity
- `DELETE /api/cart/:productId` - Remove item from cart

### Orders & Payments (Protected)
- `POST /api/orders/create-payment-order` - Initialize Razorpay checkout order
- `POST /api/orders/verify-payment` - Verify payment signature and record order
- `GET /api/orders` - List customer's orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders/:id/pay` - Retry payment for pending order

---

## ☁️ Deployment (Vercel)

ShopKart is configured for seamless monorepo deployment on **Vercel**:

1. Fork or push this repository to your GitHub account.
2. Import the project into your **Vercel Dashboard**.
3. In **Project Settings** → **Environment Variables**, add:
   - `MONGO_URI`: MongoDB Atlas Cloud URI (`mongodb+srv://...`)
   - `JWT_SECRET`: Random secure string
   - `RAZORPAY_KEY_ID`: Razorpay Key ID
   - `RAZORPAY_KEY_SECRET`: Razorpay Key Secret
   - `NODE_ENV`: `production`
4. Deploy! Vercel handles frontend asset builds and serverless function deployment automatically via `vercel.json`.

---

## 🔒 Security Practices

- **Zero Secret Leakage**: All `.env` and sensitive files are strictly excluded via `.gitignore`.
- **Safe Password Storage**: Passwords hashed using `bcryptjs` with salt rounds = 10.
- **Payment Verification**: Payments verified with cryptographic HMAC-SHA256 signatures before confirming orders.
- **Fail-Fast Database**: `serverSelectionTimeoutMS: 5000` prevents serverless hanging.

---

## 📄 License
ISC License. Built for modern web engineering showcase.
