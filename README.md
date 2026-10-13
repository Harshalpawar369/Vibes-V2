# Vibes V2

A modern full-stack, multi-role e-commerce platform featuring immersive animations, AI-powered product recommendations, secure vendor/admin dashboards, and integrated payments.

## Tech Stack

**Frontend**

* React


* Vite


* Redux Toolkit


* Tailwind CSS


* Framer Motion


* GSAP & @gsap/react


* React Router DOM


* Axios



**Backend**

* Node.js
* Express.js
* MongoDB
* Mongoose

**Recommendation Microservice**

* Python
* FastAPI
* Scikit-learn (TF-IDF)
* Pymongo
* Uvicorn

**Authentication & Security**

* JSON Web Token (JWT)
* bcrypt
* CORS
* cookie-parser
* express-rate-limit

**Payments, File Upload & Media**

* Razorpay
* Multer
* ImageKit

**Utilities**

* dotenv
* uuid
* node-cache
* nodemon

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Harshalpawar369/Vibes-V2.git
cd Vibes-V2

```

### Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend

```

Install dependencies:

```bash
npm install

```

Start the frontend:

```bash
npm run dev

```

### Backend Setup

Navigate to the backend directory:

```bash
cd ../backend

```

Install dependencies:

```bash
npm install

```

Start the backend:

```bash
npm run dev

```

### Recommendation Microservice Setup

Navigate to the recommendation directory:

```bash
cd ../recommendation

```

Install Python dependencies:

```bash
pip install fastapi uvicorn scikit-learn pymongo pydantic

```

Start the recommendation server:

```bash
uvicorn main:app --reload --port 8000

```

## Environment Variables

Create a `.env` file inside the **backend** directory:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

```

Create a `.env` file inside the **recommendation** directory:

```env
MONGO_URI=your_mongodb_connection_string

```

## Features

* Secure multi-role authentication (Admin, Vendor, Delivery, User)
* JWT-based authorization and dynamic route protection
* AI-powered product recommendations via a Python FastAPI microservice
* Integrated Razorpay checkout system
* Interactive UI with Framer Motion and GSAP scroll animations
* Image uploads managed through ImageKit and Multer
* MongoDB data persistence with Redis/node-cache caching strategies
* Responsive, high-performance design using Tailwind CSS and Vite

## Author

Harshal Pawar
GitHub: [https://github.com/Harshalpawar369](https://github.com/Harshalpawar369)
