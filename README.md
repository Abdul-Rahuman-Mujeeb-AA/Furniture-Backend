# FurniSpace – Backend API

Furnispace Backend is a RESTful API built with Node.js, Express.js, and MongoDB to support the Furnispace furniture e-commerce application. It manages user authentication, furniture products, categories, shopping carts, orders, and customer reviews.

The backend provides secure and organized communication between the frontend and database, enabling the application to deliver essential online shopping functionality.

## Technologies Used

- **Node.js** – JavaScript runtime
- **Express.js** – Backend web framework
- **MongoDB** – NoSQL database
- **Mongoose** – MongoDB object modeling
- **JWT (JSON Web Token)** – Authentication
- **bcrypt / bcryptjs** – Password hashing, if configured
- **dotenv** – Environment variable management
- **CORS** – Cross-origin request handling
- **Git and GitHub** – Version control
- **Render** – Backend deployment

## Features

- User registration and login
- JWT-based authentication
- User profile management
- Furniture product management
- Product category management
- Shopping cart operations
- Order management
- Product reviews and ratings
- MongoDB database integration
- RESTful API architecture
- Centralized error handling
- Production deployment support

## Project Structure

```text
furnispace-backend/
├── config/
│   └── db.js
├── middleware/
│   └── errorMiddleware.js
├── models/
├── controllers/
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── categoryRoutes.js
│   ├── productRoutes.js
│   ├── cartRoutes.js
│   ├── orderRoutes.js
│   └── reviewRoutes.js
├── .env
├── .gitignore
├── package.json
└── server.js
```

*The structure above is illustrative. Your actual folders and files may differ.*

## Getting Started

### Prerequisites

Install Node.js, npm, and MongoDB, or have access to a MongoDB Atlas database.

### 1. Clone the Repository

```bash
git clone <your-backend-repository-url>
cd <your-backend-folder>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the backend root directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
CLIENT_URL=http://localhost:5173
```

Replace the placeholder values with your actual configuration. Never commit your `.env` file to GitHub.

For production, set `CLIENT_URL` to your deployed frontend origin in Render's environment variable settings.

### 4. Run the Server

For a standard Node.js setup:

```bash
npm start
```

If your project has a development script:

```bash
npm run dev
```

The local API should be available at:

`http://localhost:5000`

## API Routes

The backend exposes the following route groups:

| Route | Purpose |
| `/api/auth` | Registration, login, and authentication |
| `/api/users` | User-related operations |
| `/api/categories` | Furniture categories |
| `/api/products` | Product operations |
| `/api/cart` | Shopping cart management |
| `/api/orders` | Order management |
| `/api/reviews` | Product reviews |

Example login endpoint:

```text
POST /api/auth/login
```

The request body typically contains an email address and password.

## Deployment on Render

1. Push the backend code to GitHub.
2. Create a new Web Service in Render.
3. Connect the backend repository.
4. Configure the build command as `npm install`.
5. Configure the start command according to `package.json`, such as `npm start`.
6. Add the required environment variables in Render.
7. Deploy the service and verify the API health endpoint.

The root endpoint `/` returns a JSON message confirming that the Furniture Shop API is running.

## Frontend Integration

Configure the frontend environment variable:

```env
VITE_API_URL=https://your-backend-url.onrender.com/api
```

The `/api` prefix is required because the Express application mounts its route groups under `/api`.

## Security

- Hash passwords before storing them.
- Keep database credentials and JWT secrets private.
- Validate incoming request data.
- Protect private routes with authentication middleware.
- Configure CORS for trusted frontend origins.
- Enforce authorization on protected operations.

## License

Author: Mr. Abdul Rahuman Mujeeb @2026 Add a `LICENSE` file if you intend to define usage and distribution permissions.

Furnispace Backend – Powering a modern furniture e-commerce application with RESTful APIs
