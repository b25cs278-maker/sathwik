# Location-Based Task Management Platform

A comprehensive mobile-first web application where users can discover and complete location-based tasks in their local area, upload evidence, and earn points through an admin validation system.

## 🚀 Features

### For Users
- **Location-Based Task Discovery**: Find tasks near your current location with customizable search radius
- **Real-time Updates**: Get notified when new tasks are available in your area
- **Multimedia Evidence Upload**: Capture and upload photos/videos as task completion proof
- **Gamified Experience**: Earn points, unlock achievements, and climb leaderboards
- **Geographic Leaderboards**: See top performers in your local area
- **Mobile-First Design**: Optimized for on-the-go task completion

### For Administrators
- **Task Management**: Create, edit, and manage tasks with precise locations
- **Submission Validation**: Review and approve/reject user submissions with detailed metadata
- **Analytics Dashboard**: Track user engagement, task completion rates, and platform health
- **User Management**: Monitor user activity and manage account status
- **Bulk Operations**: Efficiently process multiple submissions at once

## 🏗️ Architecture

### Technology Stack

#### Backend
- **Node.js** with **Express.js** and **TypeScript**
- **PostgreSQL** with **PostGIS** for geospatial queries
- **JWT** authentication with refresh token system
- **Socket.IO** for real-time updates
- **Multer** for file uploads
- **Joi** for data validation

#### Frontend
- **React** with **TypeScript**
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Leaflet** for interactive maps
- **Socket.IO Client** for real-time features
- **Styled Components** for styling

#### Infrastructure
- **Docker** containerization
- **Nginx** reverse proxy
- **PostgreSQL** database with spatial indexing
- **Redis** for caching (optional)

## 📦 Project Structure

```
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Authentication, validation, error handling
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic, external services
│   │   ├── models/         # Database models (if using ORM)
│   │   ├── database/       # Database connection and migrations
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   ├── uploads/           # User uploaded files
│   └── Dockerfile
├── frontend/               # React TypeScript application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API calls and external services
│   │   ├── store/         # Redux store and slices
│   │   ├── utils/         # Utility functions
│   │   ├── types/         # Frontend-specific types
│   │   └── styles/        # Global styles and theme
│   ├── public/           # Static assets
│   └── Dockerfile
├── shared/               # Shared types and utilities
│   └── src/             # Types used by both frontend and backend
├── nginx/               # Nginx configuration
├── database/            # Database initialization scripts
└── docker-compose.yml   # Development and production configurations
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Docker** and **Docker Compose** (recommended)
- **PostgreSQL** with **PostGIS** extension (if not using Docker)

### Quick Start with Docker

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd location-based-task-management
   npm run setup
   ```

2. **Start Development Environment**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   npm run dev
   ```

3. **Access Applications**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Database: localhost:5432

### Manual Setup

1. **Database Setup**
   ```bash
   # Install PostgreSQL with PostGIS
   # Create database
   createdb location_based_tasks

   # Enable PostGIS extension
   psql location_based_tasks -c "CREATE EXTENSION IF NOT EXISTS postgis;"
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   npm run migrate
   npm run seed
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Shared Types**
   ```bash
   cd shared
   npm install
   npm run build
   ```

## 🔐 Environment Configuration

### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=location_based_tasks
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_PATH=./uploads

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WS_URL=http://localhost:5000
```

## 🗄️ Database Schema

The application uses PostgreSQL with PostGIS for efficient geospatial queries:

- **users**: User accounts with location and points tracking
- **task_categories**: Categorization for different types of tasks
- **tasks**: Task definitions with locations and requirements
- **task_submissions**: User submissions with validation status
- **media_files**: Uploaded photos and videos
- **user_achievements**: Gamification achievements
- **points_history**: Transaction history of points changes

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user profile

### Users
- `PUT /api/users/location` - Update user location
- `GET /api/users/profile` - Get user profile with stats
- `GET /api/users/nearby-tasks` - Get tasks near user location

### Tasks
- `GET /api/tasks` - Get tasks with filters
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks/:id/submit` - Submit task completion
- `GET /api/tasks/submissions/my` - Get user's submissions

### Media
- `POST /api/media/upload` - Upload files
- `GET /api/media/files/my` - Get user's uploaded files
- `GET /api/media/files/:id` - Get file metadata

### Admin
- `GET /api/admin/submissions` - Get pending submissions
- `POST /api/admin/submissions/:id/approve` - Approve submission
- `POST /api/admin/submissions/:id/reject` - Reject submission
- `GET /api/admin/analytics` - Get platform analytics

## 🎮 Features in Detail

### Location-Based Task Discovery
- Geospatial queries using PostGIS for efficient radius-based searches
- Real-time location updates and task notifications
- Configurable search radius and filters
- Map-based task visualization

### Evidence Upload System
- Multi-file upload support (photos/videos)
- File type and size validation
- Metadata collection (timestamp, location)
- Preview and confirmation before submission

### Points & Gamification
- Points awarded on task completion and validation
- Achievement system for milestones
- Local and global leaderboards
- Streak bonuses and quality rewards

### Real-time Updates
- WebSocket connections for instant notifications
- New task alerts in user area
- Submission status updates
- Achievement unlock notifications

## 🔧 Development

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Code Quality
```bash
# Linting
npm run lint

# Formatting
npm run format

# Type checking
npm run type-check
```

### Database Migrations
```bash
# Run migrations
cd backend && npm run migrate

# Create new migration
# Edit src/database/migrate.ts

# Seed database
npm run seed
```

## 🚀 Production Deployment

### Docker Production
```bash
docker-compose up -d
```

### Environment Variables
Set all required environment variables for production:
- Database connection details
- JWT secrets
- File storage configuration
- CORS origins
- Rate limiting settings

### Monitoring
- Health checks on `/health` endpoint
- Application logs in `/logs`
- Database connection monitoring
- WebSocket connection tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.

## 🏆 Acknowledgments

- Built with modern web technologies
- Inspired by location-based gaming and community engagement
- Designed with mobile-first principles
- Focused on user privacy and data security