# Event Management System Backend

A robust Node.js/Express backend service for managing events, built with TypeScript and MongoDB.

## Features

- 🔐 Authentication & Authorization
- 📅 Event Management (CRUD operations)
- 🎫 Seat Booking System
- 📤 Image Upload with Cloudinary
- 🔄 Real-time Updates with Socket.IO
- 🗄️ MongoDB Database Integration

## Tech Stack

- Node.js & Express
- TypeScript
- MongoDB with Mongoose
- Socket.IO for real-time features
- JWT for authentication
- Cloudinary for image storage
- Multer for file handling
- CORS & Helmet for security

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Cloudinary account
- TypeScript

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```typescript
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
FRONTEND_URL=http://localhost:3000
```

## Installation

1. Clone the repository
2. Install dependencies:

```shell
npm install
```

## Running the Application

Development mode:

```shell
npm run dev
```

Production mode:

```shell
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Events

- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get specific event
- `POST /api/events` - Create new event (Admin only)
- `PUT /api/events/:id` - Update event (Admin only)
- `DELETE /api/events/:id` - Delete event (Admin only)
- `POST /api/events/:id/book` - Book event
- `DELETE /api/events/:id/book` - Unbook event
- `DELETE /api/events/:id/attendees/:userId` - Remove attendee (Admin only)

### File Upload

- `POST /api/upload` - Upload image

## Project Structure

```text
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/         # Database models
├── routes/         # API routes
├── types/          # TypeScript type definitions
├── socket.ts       # Socket.IO configuration
└── index.ts        # Application entry point
```

## Socket Events

- `eventCreated` - Emitted when new event is created
- `eventUpdated` - Emitted when event is updated
- `eventDeleted` - Emitted when event is deleted
- `attendeeUpdate` - Emitted when attendance changes
- `seatUpdated` - Emitted when seat booking changes

## Error Handling

The API uses standard HTTP status codes:

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

## Security Features

- JWT Authentication
- Password Hashing (bcryptjs)
- CORS Protection
- Helmet Security Headers
- File Upload Restrictions
- Role-based Access Control

## License

ISC
