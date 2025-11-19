# HomeClean Backend API

Backend API server for HomeClean application - handles payment processing with Razorpay.

## Features

- Razorpay payment integration
- Payment order creation
- Payment verification
- Pay later booking support

## Tech Stack

- Node.js
- Express.js
- Razorpay SDK
- Firebase Admin SDK

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Razorpay account and API keys

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Server Configuration
PORT=3000
NODE_ENV=development
```

## Installation

```bash
npm install
```

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Endpoints

### Health Check
- **GET** `/health`
- Returns server status

### Create Payment Order
- **POST** `/api/payment/create-order`
- Body: `{ bookingId, amount, currency }`
- Returns: Razorpay order details

### Verify Payment
- **POST** `/api/payment/verify`
- Body: `{ orderId, paymentId, signature, bookingId }`
- Returns: Payment verification status

### Pay Later
- **POST** `/api/payment/pay-later`
- Body: `{ bookingId }`
- Returns: Booking marked as due

## Deployment

### Deploy to Railway/Render/Heroku

1. Push this backend folder to a Git repository
2. Connect to your deployment platform
3. Set environment variables in the platform dashboard
4. Deploy

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

## Project Structure

```
backend/
├── controllers/
│   └── paymentController.js    # Payment logic
├── routes/
│   └── paymentRoutes.js        # API routes
├── .env                        # Environment variables
├── .gitignore                  # Git ignore rules
├── server.js                   # Entry point
├── package.json                # Dependencies
└── README.md                   # Documentation
```

## License

ISC
