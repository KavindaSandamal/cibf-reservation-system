# Migration Guide: Monolithic to Microservices Architecture

## 📋 Overview

This guide outlines the changes needed to migrate from your current **monolithic Spring Boot backend** to a **microservices architecture** running on **AWS Free Tier**.

---

## 🏗️ Current vs. Target Architecture

### **Current State (Monolithic)**
```
backend/
  └── src/main/java/com/cibf/
      ├── controller/     (AuthController, AdminController)
      ├── service/        (AuthService)
      ├── entity/         (User, Employee)
      ├── repository/     (UserRepository, EmployeeRepository)
      └── security/       (JWT, Spring Security)
```
- **Single application** running on port 8080
- **Single database** (cibf_db)
- **All code in one project**

### **Target State (Microservices)**
```
services/
  ├── authentication-service/   (Port 8081) - Your current auth code
  ├── stall-service/           (Port 8082) - New service (Member 2)
  ├── reservation-service/     (Port 8083) - New service (Member 2)
  └── user-service/            (Port 8086) - New service (Member 3)

docker-compose.yml              (Orchestrates all services)
nginx.conf                      (Reverse proxy)
```

---

## 🔄 Step-by-Step Migration Plan

### **Phase 1: Restructure Project (Week 1)**

#### **1.1 Create New Project Structure**

```bash
# Create new microservices structure
mkdir -p services/authentication-service
mkdir -p services/stall-service
mkdir -p services/reservation-service
mkdir -p services/user-service
mkdir -p infrastructure/nginx
mkdir -p infrastructure/lambda
```

#### **1.2 Extract Authentication Service**

**Move your current authentication code to a separate service:**

```bash
# Copy your existing backend code to auth service
cp -r backend/src/main/java/com/cibf/* services/authentication-service/src/main/java/com/cibf/
cp backend/build.gradle services/authentication-service/
cp backend/gradle.properties services/authentication-service/
cp -r backend/gradle services/authentication-service/
```

**Update `services/authentication-service/build.gradle`:**

```gradle
plugins {
    id 'org.springframework.boot' version '3.4.0'
    id 'io.spring.dependency-management' version '1.1.6'
}

group = 'com.cibf.auth'
version = '0.0.1-SNAPSHOT'

java {
    sourceCompatibility = '17'
}

repositories {
    mavenCentral()
}

dependencies {
    // Keep all your existing dependencies
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    
    runtimeOnly 'org.postgresql:postgresql'
    
    // JWT dependencies
    implementation 'io.jsonwebtoken:jjwt-api:0.11.5'
    runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.11.5'
    runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.11.5'
    
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
```

**Update `services/authentication-service/src/main/resources/application.properties`:**

```properties
# Server Configuration
server.port=8081  # Changed from 8080

# Database Configuration - Connect to RDS cibf_db (single database)
spring.datasource.url=jdbc:postgresql://${RDS_ENDPOINT}:5432/cibf_db
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# JWT Configuration
app.jwt-secret=${JWT_SECRET}
app.jwt-expiration-milliseconds=86400000

# Logging
logging.level.com.cibf=DEBUG
```

**Update `BackendApplication.java`:**

```java
package com.cibf.reservation.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = {"com.cibf"})
@EntityScan(basePackages = {"com.cibf.entity"})
@EnableJpaRepositories(basePackages = {"com.cibf.repository"})
public class AuthenticationServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuthenticationServiceApplication.class, args);
    }
}
```

---

### **Phase 2: Docker Setup (Week 1-2)**

#### **2.1 Create Dockerfile for Authentication Service**

**`services/authentication-service/Dockerfile`:**

```dockerfile
# Multi-stage build for smaller image
FROM gradle:8.5-jdk17 AS build
WORKDIR /app
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
COPY src ./src
RUN gradle build -x test --no-daemon

FROM openjdk:17-jre-slim
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

# Optimize JVM for container
ENV JAVA_OPTS="-Xmx256m -Xms128m"

EXPOSE 8081
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

#### **2.2 Create Docker Compose for Local Development**

**`docker-compose.yml` (root directory):**

```yaml
version: '3.8'

services:
  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: nginx-proxy
    ports:
      - "80:80"
    volumes:
      - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - auth-service
      - stall-service
      - reservation-service
      - user-service
    networks:
      - cibf-network

  # Authentication Service (Your current code)
  auth-service:
    build: ./services/authentication-service
    container_name: auth-service
    ports:
      - "8081:8081"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/cibf_db
      - SPRING_DATASOURCE_USERNAME=postgres
      - SPRING_DATASOURCE_PASSWORD=postgres
      - JWT_SECRET=${JWT_SECRET:-your-secret-key-here}
    restart: unless-stopped
    networks:
      - cibf-network
    depends_on:
      - postgres

  # PostgreSQL Database (Local development)
  postgres:
    image: postgres:15-alpine
    container_name: postgres-db
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./infrastructure/db/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - cibf-network

  # Placeholder for other services (to be implemented)
  stall-service:
    build: ./services/stall-service
    container_name: stall-service
    ports:
      - "8082:8082"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/cibf_db
      - SPRING_DATASOURCE_USERNAME=postgres
      - SPRING_DATASOURCE_PASSWORD=postgres
    networks:
      - cibf-network
    depends_on:
      - postgres
    profiles:
      - full  # Only start when needed

  reservation-service:
    build: ./services/reservation-service
    container_name: reservation-service
    ports:
      - "8083:8083"
    networks:
      - cibf-network
    profiles:
      - full

  user-service:
    build: ./services/user-service
    container_name: user-service
    ports:
      - "8086:8086"
    networks:
      - cibf-network
    profiles:
      - full

networks:
  cibf-network:
    driver: bridge

volumes:
  postgres-data:
```

#### **2.3 Create Nginx Configuration**

**`infrastructure/nginx/nginx.conf`:**

```nginx
events {
    worker_connections 1024;
}

http {
    upstream auth-service {
        server auth-service:8081;
    }
    
    upstream stall-service {
        server stall-service:8082;
    }
    
    upstream reservation-service {
        server reservation-service:8083;
    }
    
    upstream user-service {
        server user-service:8086;
    }

    server {
        listen 80;
        server_name _;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

        if ($request_method = 'OPTIONS') {
            return 204;
        }

        # Authentication Service
        location /api/auth/ {
            proxy_pass http://auth-service/api/auth/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # Stall Service
        location /api/stalls/ {
            proxy_pass http://stall-service/api/stalls/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Reservation Service
        location /api/reservations/ {
            proxy_pass http://reservation-service/api/reservations/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # User Service
        location /api/users/ {
            proxy_pass http://user-service/api/users/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Health check
        location /health {
            return 200 "OK";
            add_header Content-Type text/plain;
        }
    }
}
```

---

### **Phase 3: Database Migration (Week 1-2)**

#### **3.1 Create Database Initialization Script**

**`infrastructure/db/init.sql`:**

```sql
-- Use single database for all services (simpler approach)
-- Services are still independent, they just share the database
CREATE DATABASE cibf_db;

-- Optional: Create separate schemas for logical separation
-- CREATE SCHEMA auth;
-- CREATE SCHEMA stall;
-- CREATE SCHEMA reservation;
-- CREATE SCHEMA user_profile;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE cibf_db TO postgres;
```

**Note:** Using one database is simpler and still follows microservices principles. Services remain independent in code, deployment, and scaling - they just share the database infrastructure.

#### **3.2 Update Entity Package Names (Optional but Recommended)**

Since each service will have its own entities, you can keep the same package structure or rename:

- **Auth Service**: `com.cibf.auth.entity` (User, Employee)
- **Stall Service**: `com.cibf.stall.entity` (Stall)
- **Reservation Service**: `com.cibf.reservation.entity` (Reservation)

**For now, keep your existing package structure** (`com.cibf.*`) to minimize changes.

---

### **Phase 4: AWS Infrastructure Setup (Week 2-3)**

#### **4.1 AWS RDS Setup**

**Create RDS instance with multiple databases:**

```bash
# Using AWS CLI
aws rds create-db-instance \
  --db-instance-identifier cibf-database \
  --db-instance-class db.t2.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 20 \
  --publicly-accessible \
  --backup-retention-period 7

# Wait for creation
aws rds wait db-instance-available --db-instance-identifier cibf-database

# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier cibf-database \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

**Connect and create database:**

```bash
psql -h cibf-database.xxxx.rds.amazonaws.com -U postgres -d postgres

-- Create single database for all services
CREATE DATABASE cibf_db;

-- Optional: Create schemas for logical separation
-- CREATE SCHEMA auth;
-- CREATE SCHEMA stall;
-- CREATE SCHEMA reservation;

\q
```

#### **4.2 Update Docker Compose for AWS**

**`docker-compose.aws.yml`:**

```yaml
version: '3.8'

services:
  nginx:
    # ... same as before

  auth-service:
    build: ./services/authentication-service
    container_name: auth-service
    ports:
      - "8081:8081"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://${RDS_ENDPOINT}:5432/cibf_db
      - SPRING_DATASOURCE_USERNAME=${DB_USERNAME}
      - SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped
    networks:
      - cibf-network
    # Remove depends_on postgres (using RDS instead)

  # ... other services
```

**`.env` file (DO NOT commit to Git!):**

```bash
RDS_ENDPOINT=cibf-database.xxxx.rds.amazonaws.com
DB_USERNAME=postgres
DB_PASSWORD=YourSecurePassword123!
JWT_SECRET=your-jwt-secret-key-here
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:xxxxx:cibf-notifications
QR_LAMBDA_FUNCTION=cibf-qr-generator
AWS_REGION=us-east-1
```

---

### **Phase 5: Lambda Functions (Week 2-3)**

#### **5.1 Email Notification Lambda**

**`infrastructure/lambda/email-notification/lambda_function.py`:**

```python
import json
import boto3
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

ses_client = boto3.client('ses', region_name='us-east-1')

def lambda_handler(event, context):
    # Parse SNS message
    message = json.loads(event['Records'][0]['Sns']['Message'])
    
    user_email = message['userEmail']
    reservation_id = message['reservationId']
    stalls = message['stalls']
    qr_code_url = message['qrCodeUrl']
    
    # Create email
    subject = f"CIBF Reservation Confirmation - {reservation_id}"
    
    html_body = f"""
    <html>
        <body>
            <h2>Your Reservation is Confirmed!</h2>
            <p>Thank you for reserving stalls at the Colombo International Bookfair.</p>
            <p><strong>Reservation ID:</strong> {reservation_id}</p>
            <p><strong>Stalls:</strong> {', '.join(stalls)}</p>
            <p><strong>QR Code:</strong> <a href="{qr_code_url}">Download QR Code</a></p>
            <p>Please bring this QR code to enter the exhibition premises.</p>
        </body>
    </html>
    """
    
    # Send email via SES
    response = ses_client.send_email(
        Source='noreply@yourdomain.com',
        Destination={'ToAddresses': [user_email]},
        Message={
            'Subject': {'Data': subject},
            'Body': {'Html': {'Data': html_body}}
        }
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps('Email sent successfully')
    }
```

#### **5.2 QR Code Generation Lambda**

**`infrastructure/lambda/qr-generator/lambda_function.py`:**

```python
import json
import boto3
import qrcode
from io import BytesIO

s3_client = boto3.client('s3')
BUCKET_NAME = 'cibf-qr-codes'

def lambda_handler(event, context):
    reservation_id = event['reservationId']
    data = event['qrData']
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save to BytesIO
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    # Upload to S3
    file_key = f"qrcodes/{reservation_id}.png"
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=file_key,
        Body=buffer,
        ContentType='image/png',
        ACL='public-read'
    )
    
    # Generate public URL
    qr_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{file_key}"
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'qrCodeUrl': qr_url,
            'reservationId': reservation_id
        })
    }
```

---

### **Phase 6: Update Authentication Service for AWS Integration (Week 3-4)**

#### **6.1 Add AWS SDK Dependencies (for future Reservation Service integration)**

**`services/authentication-service/build.gradle` (add these):**

```gradle
dependencies {
    // ... existing dependencies
    
    // AWS SDK for Java (for future use)
    implementation platform('software.amazon.awssdk:bom:2.20.0')
    implementation 'software.amazon.awssdk:sns'
    implementation 'software.amazon.awssdk:lambda'
    implementation 'software.amazon.awssdk:s3'
}
```

#### **6.2 Add Health Check Endpoint**

**`services/authentication-service/src/main/java/com/cibf/controller/HealthController.java`:**

```java
package com.cibf.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class HealthController {
    
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Auth Service is running");
    }
}
```

---

### **Phase 7: Project Structure Summary**

**Final project structure:**

```
cibf-reservation-system/
├── services/
│   ├── authentication-service/     # Your current auth code
│   │   ├── src/
│   │   │   └── main/
│   │   │       ├── java/com/cibf/
│   │   │       │   ├── controller/
│   │   │       │   ├── service/
│   │   │       │   ├── entity/
│   │   │       │   ├── repository/
│   │   │       │   └── security/
│   │   │       └── resources/
│   │   │           └── application.properties
│   │   ├── Dockerfile
│   │   └── build.gradle
│   │
│   ├── stall-service/              # Member 2
│   ├── reservation-service/       # Member 2
│   └── user-service/              # Member 3
│
├── infrastructure/
│   ├── nginx/
│   │   └── nginx.conf
│   ├── db/
│   │   └── init.sql
│   └── lambda/
│       ├── email-notification/
│       └── qr-generator/
│
├── docker-compose.yml              # Local development
├── docker-compose.aws.yml          # AWS deployment
├── .env.example                    # Template (commit this)
├── .env                            # Actual secrets (DO NOT commit!)
├── .gitignore
├── README.md
├── README_DEV.md
└── MIGRATION_GUIDE.md             # This file
```

---

## 🔑 Key Changes Summary

### **1. Code Changes**
- ✅ **No major code changes needed!** Your authentication code works as-is
- ✅ Just update `application.properties` to use environment variables
- ✅ Change server port from 8080 to 8081

### **2. Project Structure**
- ✅ Extract `backend/` → `services/authentication-service/`
- ✅ Create Dockerfile for containerization
- ✅ Create Docker Compose for orchestration

### **3. Database**
- ✅ **Use single `cibf_db` database** (simpler than multiple databases)
- ✅ All services (auth, stall, reservation, user) share the same database
- ✅ Update connection string to use RDS endpoint
- ✅ Services remain independent in code - they just share DB infrastructure

### **4. Deployment**
- ✅ Deploy to EC2 using Docker Compose
- ✅ Use Nginx as reverse proxy
- ✅ Configure environment variables securely

### **5. AWS Services**
- ✅ RDS PostgreSQL (one instance, one database)
- ✅ Lambda functions (email, QR generation)
- ✅ S3 buckets (QR codes, frontends)
- ✅ SNS (email notifications)
- ✅ SES (email sending)

---

## 🚀 Quick Start Commands

### **Local Development:**
```bash
# Start all services locally
docker-compose up -d

# View logs
docker-compose logs -f auth-service

# Stop services
docker-compose down
```

### **AWS Deployment:**
```bash
# SSH into EC2
ssh -i key.pem ec2-user@your-ec2-ip

# Clone repository
git clone https://github.com/your-team/cibf-reservation.git
cd cibf-reservation

# Create .env file
nano .env  # Add RDS endpoint, passwords, etc.

# Start services
docker-compose -f docker-compose.aws.yml up -d --build
```

---

## 📝 Next Steps for Member 1

1. **Week 1-2**: Extract auth service, create Docker setup
2. **Week 2-3**: Set up AWS infrastructure (RDS, EC2, S3)
3. **Week 3-4**: Deploy Lambda functions, configure CI/CD
4. **Week 4**: Test end-to-end, document everything

---

## ⚠️ Important Notes

1. **Environment Variables**: Never commit `.env` file to Git
2. **Database Migration**: Your existing schema will work, just point to `auth_db`
3. **Port Changes**: Update frontend API URLs from `:8080` to `:80` (Nginx)
4. **Security Groups**: Configure AWS security groups to allow traffic
5. **Cost Monitoring**: Set up billing alerts to stay within Free Tier

---

## 🎯 Success Criteria

- ✅ Authentication service runs in Docker container
- ✅ Connects to RDS `auth_db` successfully
- ✅ All existing endpoints work (`/api/auth/*`)
- ✅ Nginx routes traffic correctly
- ✅ Lambda functions deployed and testable
- ✅ CI/CD pipeline functional

---

**You're ready to start the migration!** 🚀

