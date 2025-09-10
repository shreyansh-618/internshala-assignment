A modern e-commerce backend built with Hono framework and MongoDB Atlas.

## Features

- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Products**: CRUD operations with advanced filtering (search, category, price range)
- **Cart Management**: Add, update, remove items with user-specific carts
- **MongoDB Integration**: Optimized queries with proper indexing
- **Error Handling**: Comprehensive error handling and validation
- **CORS Support**: Configured for frontend integration

## Quick Start

### 1. Install Dependencies

\`\`\`bash
cd backend
npm install
\`\`\`

### 2. Environment Setup

\`\`\`bash
cp .env.example .env
\`\`\`

Update `.env` with your MongoDB Atlas connection string and JWT secret:
\`\`\`
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=your-choice-name
JWT_SECRET=your-super-secret-jwt-key-here
\`\`\`

### 3. Seed Database

\`\`\`bash
npm run seed
\`\`\`

### 4. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Products

- `GET /api/products` - Get products with filtering
- `GET /api/products/:id` - Get single product
- `GET /api/products/meta/categories` - Get all categories

### Cart

- `GET /api/cart` - Get user's cart (requires auth)
- `POST /api/cart/add` - Add item to cart (requires auth)
- `PUT /api/cart/update` - Update item quantity (requires auth)
- `DELETE /api/cart/remove/:productId` - Remove item (requires auth)
- `DELETE /api/cart/clear` - Clear cart (requires auth)

## Query Parameters

### Products Filtering

- `search` - Text search in name and description
- `category` - Filter by category
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `page` - Page number for pagination
- `limit` - Items per page

Example: `/api/products?search=headphones&category=Electronics&minPrice=100&maxPrice=300`

## Authentication

Include JWT token in Authorization header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Get the connection string
5. Replace `<username>`, `<password>`, and `<cluster-url>` in your `.env` file

## Production Deployment

1. Set environment variables on your hosting platform
2. Update CORS origins for your production domain
3. Use `npm start` to run the production server
4. Ensure MongoDB Atlas allows connections from your server's IP
   \`\`\`
