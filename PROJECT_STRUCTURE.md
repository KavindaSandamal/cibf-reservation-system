# Complete Project Structure - CIBF Reservation System

## 📁 Full Directory Tree

```
cibf-reservation-system/
│
├── README.md                          # Main project README
├── README_DEV.md                      # Developer onboarding guide
├── MIGRATION_GUIDE.md                 # Migration guide (monolith → microservices)
├── PROJECT_STRUCTURE.md               # This file
├── .gitignore                         # Git ignore rules
├── .env.example                       # Environment variables template
├── .env                               # Actual environment variables (DO NOT COMMIT!)
│
├── docker-compose.yml                  # Local development (Docker Compose)
├── docker-compose.aws.yml             # AWS deployment (Docker Compose)
│
├── services/                          # All microservices
│   │
│   ├── authentication-service/        # Member 1: Auth Service (Port 8081)
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── java/
│   │   │   │   │   └── com/
│   │   │   │   │       └── cibf/
│   │   │   │   │           ├── controller/
│   │   │   │   │   │           ├── AuthController.java
│   │   │   │   │   │           ├── AdminController.java
│   │   │   │   │   │           └── HealthController.java
│   │   │   │   │           ├── service/
│   │   │   │   │   │           ├── IAuthService.java
│   │   │   │   │   │           └── AuthService.java
│   │   │   │   │           ├── entity/
│   │   │   │   │   │           ├── User.java
│   │   │   │   │   │           ├── Employee.java
│   │   │   │   │   │           └── Role.java
│   │   │   │   │           ├── repository/
│   │   │   │   │   │           ├── UserRepository.java
│   │   │   │   │   │           └── EmployeeRepository.java
│   │   │   │   │           ├── dto/
│   │   │   │   │   │           ├── AuthRequest.java
│   │   │   │   │   │           ├── AuthResponse.java
│   │   │   │   │   │           ├── UserRegistrationRequest.java
│   │   │   │   │   │           └── EmployeeRegistrationRequest.java
│   │   │   │   │           ├── security/
│   │   │   │   │   │           ├── JwtTokenProvider.java
│   │   │   │   │   │           ├── JwtAuthenticationFilter.java
│   │   │   │   │   │           ├── CustomUserDetailsService.java
│   │   │   │   │   │           ├── SecurityConfig.java
│   │   │   │   │   │           ├── PublicSecurityConfig.java
│   │   │   │   │   │           └── JwtAuthenticationEntryPoint.java
│   │   │   │   │           └── reservation/
│   │   │   │   │               └── backend/
│   │   │   │   │                   └── AuthenticationServiceApplication.java
│   │   │   │   └── resources/
│   │   │   │       └── application.properties
│   │   │   └── test/
│   │   │       └── java/
│   │   │           └── com/
│   │   │               └── cibf/
│   │   │                   └── (test files)
│   │   ├── Dockerfile                 # Docker build file
│   │   ├── build.gradle               # Gradle build configuration
│   │   ├── settings.gradle
│   │   ├── gradle.properties
│   │   ├── gradlew                    # Gradle wrapper (Unix)
│   │   ├── gradlew.bat                # Gradle wrapper (Windows)
│   │   └── gradle/
│   │       └── wrapper/
│   │           ├── gradle-wrapper.jar
│   │           └── gradle-wrapper.properties
│   │
│   ├── stall-service/                 # Member 2: Stall Service (Port 8082)
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── java/
│   │   │   │   │   └── com/
│   │   │   │   │       └── cibf/
│   │   │   │   │           ├── controller/
│   │   │   │   │   │           └── StallController.java
│   │   │   │   │   │           ├── service/
│   │   │   │   │   │           │   ├── IStallService.java
│   │   │   │   │   │           │   └── StallService.java
│   │   │   │   │   │           ├── entity/
│   │   │   │   │   │           │   └── Stall.java
│   │   │   │   │   │           ├── repository/
│   │   │   │   │   │           │   └── StallRepository.java
│   │   │   │   │   │           └── dto/
│   │   │   │   │   │               ├── StallRequest.java
│   │   │   │   │   │               └── StallResponse.java
│   │   │   │   └── resources/
│   │   │   │       └── application.properties
│   │   │   └── test/
│   │   ├── Dockerfile
│   │   ├── build.gradle
│   │   └── (gradle files)
│   │
│   ├── reservation-service/           # Member 2: Reservation Service (Port 8083)
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── java/
│   │   │   │   │   └── com/
│   │   │   │   │       └── cibf/
│   │   │   │   │           ├── controller/
│   │   │   │   │   │           └── ReservationController.java
│   │   │   │   │   │           ├── service/
│   │   │   │   │   │           │   ├── IReservationService.java
│   │   │   │   │   │           │   └── ReservationService.java
│   │   │   │   │   │           ├── entity/
│   │   │   │   │   │           │   ├── Reservation.java
│   │   │   │   │   │           │   └── ReservationStall.java
│   │   │   │   │   │           ├── repository/
│   │   │   │   │   │           │   └── ReservationRepository.java
│   │   │   │   │   │           ├── dto/
│   │   │   │   │   │           │   ├── ReservationRequest.java
│   │   │   │   │   │           │   └── ReservationResponse.java
│   │   │   │   │   │           └── config/
│   │   │   │   │   │               └── AwsConfig.java
│   │   │   │   └── resources/
│   │   │   │       └── application.properties
│   │   │   └── test/
│   │   ├── Dockerfile
│   │   ├── build.gradle
│   │   └── (gradle files)
│   │
│   └── user-service/                 # Member 3: User Service (Port 8086)
│       ├── src/
│       │   ├── main/
│       │   │   ├── java/
│       │   │   │   └── com/
│       │   │   │       └── cibf/
│       │   │   │           ├── controller/
│       │   │   │   │           └── UserController.java
│       │   │   │   │           ├── service/
│       │   │   │   │           │   ├── IUserService.java
│       │   │   │   │           │   └── UserService.java
│       │   │   │   │           ├── entity/
│       │   │   │   │           │   ├── UserProfile.java
│       │   │   │   │           │   ├── Genre.java
│       │   │   │   │           │   └── UserGenre.java
│       │   │   │   │           ├── repository/
│       │   │   │   │           │   ├── UserProfileRepository.java
│       │   │   │   │           │   └── GenreRepository.java
│       │   │   │   │           └── dto/
│       │   │   │   │               └── UserProfileRequest.java
│       │   │   │   └── resources/
│       │   │   │       └── application.properties
│       │   │   └── test/
│       │   ├── Dockerfile
│       │   ├── build.gradle
│       │   └── (gradle files)
│
├── infrastructure/                    # Infrastructure configuration
│   │
│   ├── nginx/                         # Nginx reverse proxy
│   │   └── nginx.conf                 # Nginx configuration
│   │
│   ├── db/                            # Database scripts
│   │   └── init.sql                   # Database initialization script
│   │
│   └── lambda/                        # AWS Lambda functions
│       │
│       ├── email-notification/        # Email Lambda function
│       │   ├── lambda_function.py
│       │   ├── requirements.txt
│       │   └── README.md
│       │
│       └── qr-generator/              # QR Code Lambda function
│           ├── lambda_function.py
│           ├── requirements.txt
│           └── README.md
│
├── frontend/                          # Frontend applications (Members 4, 5, 6)
│   │
│   ├── user-portal/                   # Member 4 & 5: User Portal
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── contexts/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   └── App.tsx
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── .env.example
│   │
│   └── employee-portal/               # Member 6: Employee Portal
│       ├── public/
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── contexts/
│       │   ├── services/
│       │   ├── types/
│       │   ├── utils/
│       │   └── App.tsx
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── .env.example
│
├── docs/                              # Documentation
│   ├── 01-Architecture-Overview.md
│   ├── 02-API-Documentation.md
│   ├── 03-Database-Schema.md
│   ├── 04-Deployment-Guide.md
│   ├── 05-User-Manual.md
│   ├── 06-Testing-Documentation.md
│   ├── 07-Team-Contributions.md
│   └── 08-Demo-Script.md
│
└── scripts/                           # Utility scripts
    ├── deploy.sh                      # Deployment script
    ├── setup-aws.sh                  # AWS setup script
    └── test-all.sh                   # Test all services
```

---

## 📋 Detailed File Descriptions

### **Root Level Files**

| File | Purpose |
|------|---------|
| `README.md` | Main project documentation |
| `README_DEV.md` | Developer onboarding guide |
| `MIGRATION_GUIDE.md` | Migration from monolith to microservices |
| `PROJECT_STRUCTURE.md` | This file - complete structure |
| `.gitignore` | Git ignore patterns |
| `.env.example` | Environment variables template (commit this) |
| `.env` | Actual environment variables (DO NOT COMMIT!) |
| `docker-compose.yml` | Local development orchestration |
| `docker-compose.aws.yml` | AWS deployment orchestration |

---

### **Services Directory**

#### **1. authentication-service/** (Member 1)
- **Port**: 8081
- **Database**: `cibf_db` (tables: `users`, `employees`)
- **Purpose**: User/Employee authentication, JWT token generation
- **Key Files**:
  - `AuthController.java` - Registration/login endpoints
  - `AuthService.java` - Business logic
  - `JwtTokenProvider.java` - JWT token handling
  - `SecurityConfig.java` - Spring Security configuration

#### **2. stall-service/** (Member 2)
- **Port**: 8082
- **Database**: `cibf_db` (table: `stalls`)
- **Purpose**: Stall management, availability checking
- **Key Files**:
  - `StallController.java` - Stall CRUD endpoints
  - `StallService.java` - Business logic
  - `Stall.java` - Entity model

#### **3. reservation-service/** (Member 2)
- **Port**: 8083
- **Database**: `cibf_db` (tables: `reservations`, `reservation_stalls`)
- **Purpose**: Reservation management, AWS Lambda/SNS integration
- **Key Files**:
  - `ReservationController.java` - Reservation endpoints
  - `ReservationService.java` - Business logic + AWS integration
  - `AwsConfig.java` - AWS SDK configuration

#### **4. user-service/** (Member 3)
- **Port**: 8086
- **Database**: `cibf_db` (tables: `user_profiles`, `genres`, `user_genres`)
- **Purpose**: User profile management, genre preferences
- **Key Files**:
  - `UserController.java` - User profile endpoints
  - `UserService.java` - Business logic
  - `GenreRepository.java` - Genre management

---

### **Infrastructure Directory**

#### **nginx/**
- `nginx.conf` - Reverse proxy configuration
  - Routes `/api/auth/*` → auth-service:8081
  - Routes `/api/stalls/*` → stall-service:8082
  - Routes `/api/reservations/*` → reservation-service:8083
  - Routes `/api/users/*` → user-service:8086

#### **db/**
- `init.sql` - Database initialization
  - Creates `cibf_db` database
  - Optional: Creates schemas for logical separation

#### **lambda/**
- `email-notification/` - Python Lambda for email sending
  - Triggered by SNS
  - Uses AWS SES
- `qr-generator/` - Python Lambda for QR code generation
  - Invoked by Reservation Service
  - Stores QR codes in S3

---

### **Frontend Directory**

#### **user-portal/** (Members 4 & 5)
- React + TypeScript application
- User registration, login, stall selection, reservations
- **Key Features**:
  - Authentication pages
  - Interactive stall map
  - Reservation booking flow
  - QR code display

#### **employee-portal/** (Member 6)
- React + TypeScript application
- Employee login, dashboard, reservation management
- **Key Features**:
  - Employee authentication
  - Statistics dashboard
  - Reservation management
  - User management

---

## 🔧 Configuration Files

### **Docker Compose (Local)**
```yaml
# docker-compose.yml
- Runs all services locally
- Uses local PostgreSQL container
- Nginx reverse proxy on port 80
- All services on Docker network
```

### **Docker Compose (AWS)**
```yaml
# docker-compose.aws.yml
- Runs on EC2 instance
- Connects to RDS PostgreSQL
- Uses environment variables from .env
- Same Nginx reverse proxy
```

### **Environment Variables (.env)**
```bash
# Database
RDS_ENDPOINT=cibf-database.xxxx.rds.amazonaws.com
DB_USERNAME=postgres
DB_PASSWORD=YourSecurePassword123!

# JWT
JWT_SECRET=your-jwt-secret-key-here

# AWS Services
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:xxxxx:cibf-notifications
QR_LAMBDA_FUNCTION=cibf-qr-generator
AWS_REGION=us-east-1
```

---

## 📊 Database Schema (Single Database: `cibf_db`)

```
cibf_db
│
├── users                    (auth-service)
│   ├── id
│   ├── username
│   ├── password
│   ├── business_name
│   └── role
│
├── employees                (auth-service)
│   ├── id
│   ├── user_id (FK → users)
│   ├── name
│   ├── email
│   ├── employee_id
│   └── role
│
├── stalls                   (stall-service)
│   ├── id
│   ├── stall_name
│   ├── size
│   ├── location_x
│   ├── location_y
│   ├── price
│   └── is_available
│
├── reservations             (reservation-service)
│   ├── id
│   ├── user_id (FK → users)
│   ├── reservation_date
│   ├── status
│   ├── qr_code_url
│   └── total_amount
│
├── reservation_stalls       (reservation-service)
│   ├── reservation_id (FK → reservations)
│   └── stall_id (FK → stalls)
│
├── user_profiles            (user-service)
│   ├── id
│   ├── user_id (FK → users)
│   ├── phone_number
│   └── address
│
├── genres                   (user-service)
│   ├── id
│   └── genre_name
│
└── user_genres              (user-service)
    ├── user_id (FK → users)
    └── genre_id (FK → genres)
```

---

## 🚀 Quick Reference: Service Ports

| Service | Port | Database Tables |
|---------|------|----------------|
| **auth-service** | 8081 | `users`, `employees` |
| **stall-service** | 8082 | `stalls` |
| **reservation-service** | 8083 | `reservations`, `reservation_stalls` |
| **user-service** | 8086 | `user_profiles`, `genres`, `user_genres` |
| **nginx** | 80 | (Reverse proxy) |

---

## 📝 File Naming Conventions

### **Java Files**
- **Controllers**: `*Controller.java` (e.g., `AuthController.java`)
- **Services**: `*Service.java` (e.g., `AuthService.java`)
- **Interfaces**: `I*Service.java` (e.g., `IAuthService.java`)
- **Entities**: `*.java` (e.g., `User.java`, `Stall.java`)
- **Repositories**: `*Repository.java` (e.g., `UserRepository.java`)
- **DTOs**: `*Request.java`, `*Response.java` (e.g., `AuthRequest.java`)

### **Configuration Files**
- **Docker**: `Dockerfile` (in each service directory)
- **Docker Compose**: `docker-compose.yml`, `docker-compose.aws.yml`
- **Nginx**: `nginx.conf`
- **Database**: `init.sql`
- **Lambda**: `lambda_function.py`

### **Frontend Files**
- **Components**: `*.tsx` or `*.ts`
- **Pages**: `*.tsx`
- **Services**: `*.ts` (API clients)
- **Types**: `*.ts` (TypeScript interfaces)

---

## 🎯 Key Directories Summary

| Directory | Purpose | Owner |
|-----------|---------|-------|
| `services/authentication-service/` | Auth & JWT | Member 1 |
| `services/stall-service/` | Stall management | Member 2 |
| `services/reservation-service/` | Reservations | Member 2 |
| `services/user-service/` | User profiles | Member 3 |
| `infrastructure/nginx/` | Reverse proxy | Member 1 |
| `infrastructure/lambda/` | AWS Lambda functions | Member 1 & 3 |
| `frontend/user-portal/` | User React app | Members 4 & 5 |
| `frontend/employee-portal/` | Employee React app | Member 6 |
| `docs/` | Documentation | All members |

---

## ✅ Next Steps

1. **Create the directory structure** using the tree above
2. **Move your current `backend/` code** to `services/authentication-service/`
3. **Create Dockerfiles** for each service
4. **Set up Docker Compose** for local development
5. **Configure Nginx** reverse proxy
6. **Set up AWS infrastructure** (RDS, EC2, Lambda, S3)

---

**This structure supports:**
- ✅ Microservices architecture
- ✅ Independent service deployment
- ✅ Docker containerization
- ✅ AWS Free Tier deployment
- ✅ Team collaboration (clear ownership)
- ✅ Scalability and maintainability

