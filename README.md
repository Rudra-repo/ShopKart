# ShopKart

A modern, responsive e-commerce web application with a luxury monochrome theme, real-time cart and wishlist management, order delivery tracking, and live Razorpay payment gateway integration.

## Features
- **Monochrome Luxury Design**: Dark velvet aesthetic with frosted glassmorphism and emerald green brand accent.
- **Fully Responsive**: Optimized across all viewports (Mobile, Tablet, Desktop) with touch-friendly navigation drawer.
- **Dynamic Search & Filters**: Instant search, 2-column mobile category/sort controls, and 1-tap quick category filter chips.
- **Cart & Wishlist**: Real-time count badges, quantity controls, out-of-stock validation, and persistent storage.
- **Payment Gateway**: Integrated with Razorpay test gateway plus a built-in instant checkout test simulator.
- **Order Tracking**: Visual delivery progression timeline (Placed → Confirmed → Shipped → Delivered) and payment retry.

## Tech Stack
- **Frontend**: React, Vite, React Router, Framer Motion, Lucide Icons
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT, Razorpay SDK

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env` (refer to `.env.example`).
3. Run backend server:
   ```bash
   npm run server
   ```
4. Run frontend development server:
   ```bash
   npm run dev
   ```
