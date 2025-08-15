# Environment Configuration

## Overview
The Richmond Document Management System uses a centralized environment configuration approach. All settings are managed from the main `.env` file in the project root.

## Configuration Files

### Main Configuration: `.env`
The primary environment file containing all application settings:
- Database connections (PostgreSQL, MongoDB, Redis, Elasticsearch)
- Authentication secrets (JWT tokens)
- AI service configuration (OpenRouter API)
- Server settings (ports, CORS, file limits)
- Integration URLs
- Company information

### Auto-Generated Files
These files are automatically created/updated by `start.sh`:

#### `backend/.env`
- Copy of main `.env` with backend-specific overrides
- Ensures `PORT=4000` and `FRONTEND_URL=http://localhost:3000`

#### `frontend/.env.local`
- Frontend-specific environment variables
- Contains `NEXT_PUBLIC_*` variables for client-side access
- Ensures `PORT=3000` and `BACKEND_URL=http://localhost:4000`

## How It Works

1. **Single Source of Truth**: Edit only the main `.env` file
2. **Automatic Distribution**: `start.sh` copies and configures environment files
3. **Port Management**: Script ensures services use correct ports (3000/4000)
4. **Environment Isolation**: Each service gets only needed variables

## Key Variables

### Backend Variables
```bash
PORT=4000
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres@localhost:5432/dms_dev
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

### Frontend Variables
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_COMPANY_NAME=Richmond DMS
```

## Usage

1. **Edit Configuration**: Modify `.env` in project root
2. **Start System**: Run `./start.sh` - it handles all environment setup
3. **No Manual Copying**: Environment files are managed automatically

## Benefits

- ✅ **Centralized Configuration**: One file to manage all settings
- ✅ **Automatic Setup**: No manual environment file management
- ✅ **Consistent Ports**: Services always use correct ports
- ✅ **Development Ready**: Optimized for local development
- ✅ **Production Ready**: Easy to override for deployment

## Production Deployment

For production, override key variables:
```bash
NODE_ENV=production
DEBUG=false
DATABASE_URL=your_production_db_url
FRONTEND_URL=https://your-domain.com
JWT_SECRET=secure_production_secret
```