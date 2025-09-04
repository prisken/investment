# 🚀 Investment App - US & HK Stock Markets

A comprehensive investment platform providing real-time market data, AI-powered recommendations, and portfolio management for US and Hong Kong stock markets.

## ✨ Features

- **Real-time Market Data**: Live US & HK stock market information
- **AI Investment Recommendations**: Smart portfolio suggestions based on goals
- **Portfolio Management**: Track investments and performance
- **Smart Alerts**: Price alerts and portfolio notifications
- **Cross-Platform**: React Native app with web support
- **Secure Authentication**: JWT-based user management
- **Automated Backups**: Database backup and recovery system

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │    │   Node.js API   │    │  PostgreSQL    │
│     Frontend    │◄──►│    Backend      │◄──►│   Database     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Expo Web      │    │   Redis Cache   │    │   Cloud        │
│   Interface     │    │   & Sessions    │    │   Storage      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+ (optional)
- Docker & Docker Compose (recommended)

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/prisken/investment.git
   cd investment
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:19006
   - Backend API: http://localhost:3000
   - Database: localhost:5432

### Option 2: Local Development Setup

1. **Install dependencies**
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd backend
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cd backend
   cp env.example .env
   # Edit .env with your database credentials
   ```

3. **Start the services**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev
   
   # Terminal 2: Frontend
   npm start
   ```

## 🔧 Configuration

### Environment Variables

Copy `backend/env.example` to `backend/.env` and configure:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=investment_app_dev
DB_USER=postgres
DB_PASSWORD=your_password

# API Keys (Free Tier)
ALPHA_VANTAGE_API_KEY=your_key
YAHOO_FINANCE_API_KEY=your_key
FINNHUB_API_KEY=your_key

# JWT
JWT_SECRET=your_super_secret_key
```

### Database Setup

1. **Create database**
   ```sql
   CREATE DATABASE investment_app_dev;
   CREATE DATABASE investment_app_test;
   ```

2. **Run migrations** (if any)
   ```bash
   cd backend
   npm run migrate
   ```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                    # Run all tests
npm run test:coverage      # With coverage report
npm run test:watch         # Watch mode
```

### Frontend Tests
```bash
npm test                   # Run frontend tests
npm run lint              # Lint code
npx tsc --noEmit          # Type check
```

## 📦 CI/CD Pipeline

The project includes a comprehensive GitHub Actions CI/CD pipeline:

- **Automated Testing**: Runs on every push and PR
- **Code Quality**: ESLint, TypeScript checking
- **Security Scanning**: Dependency vulnerability checks
- **Automated Deployment**: Staging and production deployments
- **Database Backups**: Daily automated backups
- **Performance Testing**: Load and performance validation

### Pipeline Jobs

1. **Backend Testing**: Unit tests, integration tests, code coverage
2. **Frontend Testing**: Type checking, linting, unit tests
3. **Security**: Dependency audits, vulnerability scanning
4. **Deployment**: Automated staging and production deployments
5. **Backup**: Daily database backups with cloud storage
6. **Performance**: Load testing and performance validation

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Cross-origin request protection
- **Helmet Security**: Security headers and protection
- **Input Validation**: Request data validation and sanitization
- **SQL Injection Protection**: Parameterized queries
- **HTTPS Enforcement**: SSL/TLS encryption

## 📊 Monitoring & Logging

- **Health Checks**: `/health` and `/health/db` endpoints
- **Structured Logging**: Winston logger with multiple transports
- **Performance Metrics**: Response time and throughput monitoring
- **Error Tracking**: Comprehensive error logging and reporting
- **Database Monitoring**: Connection pool and query performance

## 🗄️ Backup & Recovery

### Automated Backup System

- **Daily Backups**: Full database backups at 3 AM UTC
- **Compression**: Gzip compression to reduce storage
- **Cloud Storage**: Support for S3, GCS, and Azure
- **Retention Policy**: 30 days for full, 7 days for incremental
- **Verification**: Backup integrity checks
- **Email Notifications**: Success/failure notifications

### Manual Backup
```bash
cd backend
node scripts/backup.js --type=full --compress --upload
```

### Restore from Backup
```bash
# Decompress if needed
gunzip backup_file.sql.gz

# Restore to database
psql -h localhost -U postgres -d investment_app_dev < backup_file.sql
```

## 🚀 Deployment

### Production Deployment

1. **Set production environment variables**
2. **Build Docker image**
   ```bash
   docker build -t investment-app:latest .
   ```

3. **Deploy to your hosting platform**
   - Railway.app (recommended for free tier)
   - Render.com
   - Heroku
   - AWS/GCP/Azure

### Environment-Specific Configs

- **Development**: Local PostgreSQL, mock data fallback
- **Staging**: Staging database, limited API calls
- **Production**: Production database, full API access

## 📱 Mobile App Development

### React Native Setup
```bash
# Install Expo CLI
npm install -g @expo/cli

# Start development server
npm start

# Run on device
# Scan QR code with Expo Go app
```

### Platform-Specific Features
- **iOS**: Native iOS components and gestures
- **Android**: Material Design components
- **Web**: Responsive web interface

## 🔧 Development Tools

- **VS Code Extensions**: Recommended extensions for development
- **Git Hooks**: Pre-commit hooks for code quality
- **Debugging**: Node.js and React Native debugging setup
- **Hot Reload**: Fast development with hot reloading

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - User profile

### Market Data Endpoints
- `GET /api/market/overview` - Market overview
- `GET /api/market/indices/us` - US market indices
- `GET /api/market/indices/hk` - HK market indices
- `GET /api/market/stocks/:symbol` - Stock information

### Portfolio Endpoints
- `GET /api/portfolio` - User portfolio
- `POST /api/portfolio/positions` - Add position
- `PUT /api/portfolio/positions/:id` - Update position

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the [docs/](docs/) folder
- **Issues**: Report bugs via [GitHub Issues](https://github.com/prisken/investment/issues)
- **Discussions**: Join the [GitHub Discussions](https://github.com/prisken/investment/discussions)

## 🎯 Roadmap

- [ ] **Phase 1**: Market Data System ✅
- [ ] **Phase 2**: AI Investment Recommendations
- [ ] **Phase 3**: Smart Alert System
- [ ] **Phase 4**: Investment Implementation
- [ ] **Phase 5**: Testing & Launch

## 🙏 Acknowledgments

- Built with React Native and Node.js
- Market data from free tier APIs
- Icons from Expo Vector Icons
- Charts from React Native Chart Kit

---

**Made with ❤️ for the investment community**
