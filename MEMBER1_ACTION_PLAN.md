# Member 1 Action Plan - Step by Step

## 🎯 Your Responsibilities (From Architecture Document)

**Week 1-2: AWS Infrastructure Setup**
- Create AWS Free Tier account
- Launch EC2 t2.micro instance
- Install Docker and Docker Compose
- Create RDS PostgreSQL db.t2.micro instance
- Set up S3 buckets
- Configure Security Groups
- Write Nginx reverse proxy configuration
- Create Docker Compose file

**Week 2-3: Lambda Functions & AWS Services**
- Create Email Notification Lambda (Python + SES)
- Create QR Code Generation Lambda (Python + S3)
- Set up AWS SNS topic
- Configure AWS SES
- Test Lambda functions

**Week 3-4: Authentication Service & CI/CD**
- Extract Authentication Service to microservices structure
- Create Dockerfile for Auth Service
- Deploy to EC2
- Set up GitHub Actions CI/CD pipeline
- Configure environment variables securely

---

## ✅ What You've Already Completed

- ✅ Authentication system working (JWT, Spring Security)
- ✅ User and Employee registration/login endpoints
- ✅ Password encryption (BCrypt)
- ✅ Database configuration
- ✅ Base entities and repositories
- ✅ Role-based authorization
- ✅ Code quality and OOP principles

---

## 🚀 What To Do Now (Priority Order)

### **Phase 1: Extract Authentication Service (Week 1) - START HERE**

#### **Step 1.1: Create Microservices Structure**

```bash
# In your project root (cibf-reservation-system/)
mkdir -p services/authentication-service
mkdir -p infrastructure/nginx
mkdir -p infrastructure/db
mkdir -p infrastructure/lambda/email-notification
mkdir -p infrastructure/lambda/qr-generator
```

#### **Step 1.2: Move Your Current Code**

```bash
# Copy your existing backend to authentication-service
cp -r backend/src services/authentication-service/src
cp backend/build.gradle services/authentication-service/
cp backend/settings.gradle services/authentication-service/
cp backend/gradle.properties services/authentication-service/
cp -r backend/gradle services/authentication-service/
cp backend/gradlew services/authentication-service/
cp backend/gradlew.bat services/authentication-service/
```

#### **Step 1.3: Update Authentication Service Configuration**

**Update `services/authentication-service/src/main/resources/application.properties`:**

```properties
# Server Configuration
server.port=8081  # Changed from 8080

# Database Configuration - Use environment variables
spring.datasource.url=jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:cibf_db}
spring.datasource.username=${DB_USERNAME:postgres}
spring.datasource.password=${DB_PASSWORD:postgres}
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# JWT Configuration - Use environment variable
app.jwt-secret=${JWT_SECRET:JE6WwDKZ8uMOOwt+XnkQTPvb2sj0BD58Kc1WwxTHfVaB7otOwANuKKhbGPvKjA6hDyo0y7qls24Irt6rHLINEA==}
app.jwt-expiration-milliseconds=86400000

# Logging
logging.level.com.cibf=DEBUG
logging.level.org.springframework.security=DEBUG
```

#### **Step 1.4: Update Main Application Class**

**Update `services/authentication-service/src/main/java/com/cibf/reservation/backend/BackendApplication.java`:**

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

#### **Step 1.5: Create Dockerfile**

**Create `services/authentication-service/Dockerfile`:**

```dockerfile
# Multi-stage build for smaller image
FROM gradle:8.5-jdk17 AS build
WORKDIR /app

# Copy Gradle files
COPY build.gradle settings.gradle ./
COPY gradle ./gradle

# Copy source code
COPY src ./src

# Build application (skip tests for faster build)
RUN gradle build -x test --no-daemon

# Runtime stage
FROM openjdk:17-jre-slim
WORKDIR /app

# Copy built JAR
COPY --from=build /app/build/libs/*.jar app.jar

# Optimize JVM for container (t2.micro has 1GB RAM)
ENV JAVA_OPTS="-Xmx256m -Xms128m"

EXPOSE 8081

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

#### **Step 1.6: Test Locally**

```bash
# Navigate to authentication service
cd services/authentication-service

# Build and run locally first
./gradlew bootRun

# Test endpoints
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test@cibf.com","password":"password123","businessName":"Test Business"}'
```

---

### **Phase 2: Docker Setup (Week 1-2)**

#### **Step 2.1: Create Docker Compose for Local Development**

**Create `docker-compose.yml` in project root:**

```yaml
version: '3.8'

services:
  # PostgreSQL Database (Local Development)
  postgres:
    image: postgres:15-alpine
    container_name: postgres-db
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=cibf_db
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./infrastructure/db/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - cibf-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Authentication Service
  auth-service:
    build: ./services/authentication-service
    container_name: auth-service
    ports:
      - "8081:8081"
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=cibf_db
      - DB_USERNAME=postgres
      - DB_PASSWORD=postgres
      - JWT_SECRET=${JWT_SECRET:-your-secret-key-here}
    restart: unless-stopped
    networks:
      - cibf-network
    depends_on:
      postgres:
        condition: service_healthy

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
    networks:
      - cibf-network

networks:
  cibf-network:
    driver: bridge

volumes:
  postgres-data:
```

#### **Step 2.2: Create Nginx Configuration**

**Create `infrastructure/nginx/nginx.conf`:**

```nginx
events {
    worker_connections 1024;
}

http {
    upstream auth-service {
        server auth-service:8081;
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

        # Health check
        location /health {
            return 200 "OK";
            add_header Content-Type text/plain;
        }
    }
}
```

#### **Step 2.3: Create Database Init Script**

**Create `infrastructure/db/init.sql`:**

```sql
-- Create database (if not exists)
CREATE DATABASE cibf_db;

-- Connect to cibf_db
\c cibf_db

-- Database will be initialized by Hibernate (spring.jpa.hibernate.ddl-auto=update)
-- No need to create tables manually
```

#### **Step 2.4: Test Docker Setup Locally**

```bash
# Start all services
docker-compose up -d --build

# View logs
docker-compose logs -f auth-service

# Test endpoint through Nginx
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test@cibf.com","password":"password123","businessName":"Test Business"}'

# Stop services
docker-compose down
```

---

### **Phase 3: AWS Infrastructure Setup (Week 2)**

#### **Step 3.1: Create AWS Account**

1. Go to https://aws.amazon.com/free/
2. Create account
3. Set up billing alerts ($5 threshold)
4. Enable MFA for security

#### **Step 3.2: Create RDS PostgreSQL Instance**

```bash
# Install AWS CLI first
# Then configure: aws configure

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier cibf-database \
  --db-instance-class db.t2.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 20 \
  --publicly-accessible \
  --backup-retention-period 7 \
  --engine-version 15.4

# Wait for creation (5-10 minutes)
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

CREATE DATABASE cibf_db;
\q
```

#### **Step 3.3: Create S3 Buckets**

```bash
# Create buckets
aws s3 mb s3://cibf-qr-codes
aws s3 mb s3://cibf-user-portal
aws s3 mb s3://cibf-employee-portal

# Set bucket policies (for QR codes bucket - public read)
cat > qr-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::cibf-qr-codes/*"
  }]
}
EOF

aws s3api put-bucket-policy --bucket cibf-qr-codes --policy file://qr-policy.json
```

#### **Step 3.4: Launch EC2 Instance**

```bash
# Launch EC2 t2.micro instance
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.micro \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=cibf-server}]'

# Get public IP
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=cibf-server" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text
```

#### **Step 3.5: Setup EC2 Instance**

```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@your-ec2-ip

# Install Docker
sudo yum update -y
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login to apply group changes
exit
ssh -i your-key.pem ec2-user@your-ec2-ip

# Verify installations
docker --version
docker-compose --version
```

---

### **Phase 4: Lambda Functions (Week 2-3)**

#### **Step 4.1: Create Email Notification Lambda**

**Create `infrastructure/lambda/email-notification/lambda_function.py`:**

```python
import json
import boto3

ses_client = boto3.client('ses', region_name='us-east-1')

def lambda_handler(event, context):
    # Parse SNS message
    message = json.loads(event['Records'][0]['Sns']['Message'])
    
    user_email = message['userEmail']
    reservation_id = message['reservationId']
    stalls = message.get('stalls', [])
    qr_code_url = message.get('qrCodeUrl', '')
    
    # Create email
    subject = f"CIBF Reservation Confirmation - {reservation_id}"
    
    html_body = f"""
    <html>
        <body>
            <h2>Your Reservation is Confirmed!</h2>
            <p>Thank you for reserving stalls at the Colombo International Bookfair.</p>
            <p><strong>Reservation ID:</strong> {reservation_id}</p>
            <p><strong>Stalls:</strong> {', '.join(stalls) if stalls else 'N/A'}</p>
            <p><strong>QR Code:</strong> <a href="{qr_code_url}">Download QR Code</a></p>
            <p>Please bring this QR code to enter the exhibition premises.</p>
        </body>
    </html>
    """
    
    # Send email via SES
    try:
        response = ses_client.send_email(
            Source='noreply@yourdomain.com',  # Must be verified in SES
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
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
```

**Create `infrastructure/lambda/email-notification/requirements.txt`:**

```
boto3>=1.28.0
```

#### **Step 4.2: Create QR Code Generation Lambda**

**Create `infrastructure/lambda/qr-generator/lambda_function.py`:**

```python
import json
import boto3
import qrcode
from io import BytesIO

s3_client = boto3.client('s3')
BUCKET_NAME = 'cibf-qr-codes'

def lambda_handler(event, context):
    reservation_id = event.get('reservationId')
    data = event.get('qrData', json.dumps(event))
    
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
    try:
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
    except Exception as e:
        print(f"Error generating QR: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
```

**Create `infrastructure/lambda/qr-generator/requirements.txt`:**

```
boto3>=1.28.0
qrcode[pil]>=7.4.2
Pillow>=10.0.0
```

#### **Step 4.3: Deploy Lambda Functions**

```bash
# Create deployment packages
cd infrastructure/lambda/email-notification
pip install -r requirements.txt -t .
zip -r email-notification.zip .

cd ../qr-generator
pip install -r requirements.txt -t .
zip -r qr-generator.zip .

# Deploy via AWS Console or CLI
# (Instructions in MIGRATION_GUIDE.md)
```

---

### **Phase 5: Deploy to AWS (Week 3-4)**

#### **Step 5.1: Create Docker Compose for AWS**

**Create `docker-compose.aws.yml`:**

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: nginx-proxy
    ports:
      - "80:80"
    volumes:
      - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - auth-service
    networks:
      - cibf-network
    restart: unless-stopped

  auth-service:
    build: ./services/authentication-service
    container_name: auth-service
    ports:
      - "8081:8081"
    environment:
      - DB_HOST=${RDS_ENDPOINT}
      - DB_PORT=5432
      - DB_NAME=cibf_db
      - DB_USERNAME=${DB_USERNAME}
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped
    networks:
      - cibf-network

networks:
  cibf-network:
    driver: bridge
```

#### **Step 5.2: Deploy to EC2**

```bash
# On EC2 instance
git clone https://github.com/your-team/cibf-reservation.git
cd cibf-reservation

# Create .env file
cat > .env << EOF
RDS_ENDPOINT=cibf-database.xxxx.rds.amazonaws.com
DB_USERNAME=postgres
DB_PASSWORD=YourSecurePassword123!
JWT_SECRET=your-jwt-secret-key-here
EOF

# Start services
docker-compose -f docker-compose.aws.yml up -d --build

# Check logs
docker-compose -f docker-compose.aws.yml logs -f auth-service
```

---

### **Phase 6: CI/CD Setup (Week 4)**

#### **Step 6.1: Create GitHub Actions Workflow**

**Create `.github/workflows/deploy.yml`:**

```yaml
name: Deploy to EC2

on:
  push:
    branches: [ main, feature/auth-setup ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to EC2
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.EC2_HOST }}
        username: ec2-user
        key: ${{ secrets.EC2_SSH_KEY }}
        script: |
          cd cibf-reservation
          git pull origin main
          docker-compose -f docker-compose.aws.yml down
          docker-compose -f docker-compose.aws.yml up -d --build
```

---

## 📋 Checklist for Member 1

### **Week 1: Extract & Docker Setup**
- [ ] Create microservices directory structure
- [ ] Move authentication code to `services/authentication-service/`
- [ ] Update application.properties (port 8081, env variables)
- [ ] Create Dockerfile for auth service
- [ ] Create docker-compose.yml for local development
- [ ] Create Nginx configuration
- [ ] Test locally with Docker Compose
- [ ] Commit changes to Git

### **Week 2: AWS Infrastructure**
- [ ] Create AWS account
- [ ] Set up billing alerts
- [ ] Create RDS PostgreSQL instance
- [ ] Create S3 buckets (QR codes, portals)
- [ ] Launch EC2 t2.micro instance
- [ ] Install Docker & Docker Compose on EC2
- [ ] Configure security groups
- [ ] Test RDS connection from EC2

### **Week 3: Lambda Functions**
- [ ] Create Email Notification Lambda
- [ ] Create QR Code Generation Lambda
- [ ] Set up AWS SNS topic
- [ ] Configure AWS SES (verify email)
- [ ] Test Lambda functions
- [ ] Deploy Lambda functions

### **Week 4: Deployment & CI/CD**
- [ ] Create docker-compose.aws.yml
- [ ] Deploy authentication service to EC2
- [ ] Test endpoints on EC2
- [ ] Set up GitHub Actions CI/CD
- [ ] Configure environment variables securely
- [ ] Document deployment process
- [ ] Hand off to other team members

---

## 🎯 Immediate Next Steps (Do This First!)

1. **Create directory structure** (5 minutes)
2. **Move your code** to `services/authentication-service/` (10 minutes)
3. **Update application.properties** (5 minutes)
4. **Create Dockerfile** (10 minutes)
5. **Test locally** (15 minutes)

**Total time: ~45 minutes to get started!**

---

## 📚 Reference Documents

- `MIGRATION_GUIDE.md` - Detailed migration steps
- `PROJECT_STRUCTURE.md` - Complete project structure
- `README_DEV.md` - Developer guide
- `new-arch.md` - Full architecture document

---

**Start with Phase 1, Step 1.1 - Create the directory structure!** 🚀

