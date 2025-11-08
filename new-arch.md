# AWS Free Tier Only - Microservices Architecture
## Colombo International Bookfair Reservation System

> **Total Monthly Cost: $0** (within Free Tier limits)

---

## ✅ AWS Free Tier Services Used

### 1. **EC2 - 750 hours/month (t2.micro or t3.micro)**
- **What you get**: 750 hours = 1 instance running 24/7 for a month
- **Strategy**: Run all microservices on **ONE EC2 instance** using Docker
- **Instance type**: t2.micro (1 vCPU, 1GB RAM) or t3.micro
- **OS**: Amazon Linux 2 (free tier eligible)

### 2. **RDS - 750 hours/month (db.t2.micro or db.t3.micro)**
- **What you get**: 750 hours of PostgreSQL database
- **Strategy**: Use **ONE RDS instance** with multiple databases
- **Storage**: 20GB SSD (free)
- **Backups**: 20GB backup storage (free)

### 3. **S3 - 5GB storage, 20,000 GET, 2,000 PUT requests/month**
- Store QR codes
- Host React frontends (static websites)
- Store logs

### 4. **CloudFront - 50GB data transfer out/month**
- Free HTTPS for frontend hosting
- CDN for static assets

### 5. **Lambda - 1M requests/month, 400,000 GB-seconds compute**
- Email sending (replaces Email Service)
- QR code generation (replaces QR Service)

### 6. **DynamoDB - 25GB storage, 25 read/write capacity units**
- Optional: For session management or caching
- **We'll use PostgreSQL instead to keep it simple**

### 7. **SNS - 1,000 email notifications/month**
- Free email notifications
- Replaces SQS + Email Service

### 8. **API Gateway - 1M API calls/month**
- Optional: Single entry point for all services
- **We'll skip this to save complexity**

---

## 🏗️ Revised Architecture (Free Tier)

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (Free)                       │
├─────────────────────────────────────────────────────────────┤
│  User Portal                    Employee Portal              │
│  (React - S3 Static Website)   (React - S3 Static Website)  │
│  s3://cibf-user-portal         s3://cibf-employee-portal    │
│  + CloudFront (Free SSL)       + CloudFront (Free SSL)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Single EC2 Instance (t2.micro)                  │
│              Running Docker Containers                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ Auth Service   │  │ Stall Service  │  │ Reservation  │  │
│  │ (Port 8081)    │  │ (Port 8082)    │  │ Service      │  │
│  │ Spring Boot    │  │ Spring Boot    │  │ (Port 8083)  │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
│                                                               │
│  ┌────────────────┐  ┌────────────────┐                     │
│  │ User Service   │  │ Gateway/Proxy  │                     │
│  │ (Port 8086)    │  │ (Nginx)        │                     │
│  │ Spring Boot    │  │ (Port 80)      │                     │
│  └────────────────┘  └────────────────┘                     │
│                                                               │
│  EC2 Public IP: xx.xx.xx.xx                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│           AWS Lambda Functions (Serverless)                  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────────┐    │
│  │ Email Function       │  │ QR Code Function         │    │
│  │ (Triggered by SNS)   │  │ (Triggered by S3)        │    │
│  │ Uses AWS SES         │  │ Stores in S3             │    │
│  └──────────────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              RDS PostgreSQL (db.t2.micro)                    │
│              Single Instance, Multiple Databases             │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  auth_db     │  │  stall_db    │  │reservation_db│     │
│  │ (Users,      │  │ (Stalls)     │  │(Reservations)│     │
│  │  Tokens)     │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  Single RDS: cibf-database.xxxx.rds.amazonaws.com           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   AWS S3 Buckets                             │
├─────────────────────────────────────────────────────────────┤
│  cibf-qr-codes         : QR code images                     │
│  cibf-user-portal      : User portal static files           │
│  cibf-employee-portal  : Employee portal static files       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Key Changes from Original Architecture

| Original | Free Tier Alternative |
|----------|----------------------|
| 6 separate EC2 instances | **1 EC2 instance** with all services in Docker |
| 3 separate RDS instances | **1 RDS instance** with 3 databases |
| AWS SQS for messaging | **AWS SNS** (free email notifications) |
| Dedicated Email Service | **AWS Lambda + SES** (free for 62K emails/month) |
| Dedicated QR Service | **AWS Lambda** (triggered on reservation) |
| Application Load Balancer ($20/month) | **Nginx reverse proxy** on EC2 |
| Separate email service | **AWS Lambda + SES** |

---

## 📦 Single EC2 Instance Setup

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - auth-service
      - stall-service
      - reservation-service
      - user-service
    networks:
      - cibf-network

  auth-service:
    build: ./services/authentication-service
    container_name: auth-service
    ports:
      - "8081:8081"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://${RDS_ENDPOINT}:5432/auth_db
      - SPRING_DATASOURCE_USERNAME=${DB_USERNAME}
      - SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped
    networks:
      - cibf-network

  stall-service:
    build: ./services/stall-service
    container_name: stall-service
    ports:
      - "8082:8082"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://${RDS_ENDPOINT}:5432/stall_db
      - SPRING_DATASOURCE_USERNAME=${DB_USERNAME}
      - SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD}
    restart: unless-stopped
    networks:
      - cibf-network

  reservation-service:
    build: ./services/reservation-service
    container_name: reservation-service
    ports:
      - "8083:8083"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://${RDS_ENDPOINT}:5432/reservation_db
      - SPRING_DATASOURCE_USERNAME=${DB_USERNAME}
      - SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD}
      - STALL_SERVICE_URL=http://stall-service:8082
      - USER_SERVICE_URL=http://user-service:8086
      - AWS_SNS_TOPIC_ARN=${SNS_TOPIC_ARN}
      - AWS_LAMBDA_QR_FUNCTION=${QR_LAMBDA_FUNCTION}
    restart: unless-stopped
    networks:
      - cibf-network

  user-service:
    build: ./services/user-service
    container_name: user-service
    ports:
      - "8086:8086"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://${RDS_ENDPOINT}:5432/auth_db
      - SPRING_DATASOURCE_USERNAME=${DB_USERNAME}
      - SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD}
    restart: unless-stopped
    networks:
      - cibf-network

networks:
  cibf-network:
    driver: bridge
```

### Nginx Reverse Proxy Configuration

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

        location /api/auth/ {
            proxy_pass http://auth-service/api/auth/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /api/stalls/ {
            proxy_pass http://stall-service/api/stalls/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /api/reservations/ {
            proxy_pass http://reservation-service/api/reservations/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /api/users/ {
            proxy_pass http://user-service/api/users/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /health {
            return 200 "OK";
            add_header Content-Type text/plain;
        }
    }
}
```

---

## 🗄️ Single RDS Instance with Multiple Databases

### Database Setup Script

```sql
-- Connect to PostgreSQL as master user
-- Create separate databases
CREATE DATABASE auth_db;
CREATE DATABASE stall_db;
CREATE DATABASE reservation_db;

-- Optional: Create separate users for each service (better security)
CREATE USER auth_user WITH PASSWORD 'auth_password';
CREATE USER stall_user WITH PASSWORD 'stall_password';
CREATE USER reservation_user WITH PASSWORD 'reservation_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE auth_db TO auth_user;
GRANT ALL PRIVILEGES ON DATABASE stall_db TO stall_user;
GRANT ALL PRIVILEGES ON DATABASE reservation_db TO reservation_user;

-- Or use single user for simplicity (not recommended for production)
-- Just use the master username from RDS
```

---

## ⚡ AWS Lambda Functions (Serverless)

### 1. Email Notification Lambda

**Trigger**: SNS Topic (when reservation is created)

```python
# lambda_email_notification.py
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
    subject = f"Booking Confirmation - {reservation_id}"
    
    html_body = f"""
    <html>
        <body>
            <h2>Booking Confirmed!</h2>
            <p>Your reservation has been confirmed.</p>
            <p><strong>Reservation ID:</strong> {reservation_id}</p>
            <p><strong>Stalls:</strong> {', '.join(stalls)}</p>
            <p><strong>QR Code:</strong> <a href="{qr_code_url}">Download QR Code</a></p>
        </body>
    </html>
    """
    
    # Send email via SES
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
```

### 2. QR Code Generation Lambda

**Trigger**: Invoked by Reservation Service via AWS SDK

```python
# lambda_qr_generator.py
import json
import boto3
import qrcode
from io import BytesIO

s3_client = boto3.client('s3')
BUCKET_NAME = 'cibf-qr-codes'

def lambda_handler(event, context):
    reservation_id = event['reservationId']
    data = event['qrData']  # JSON string with reservation details
    
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

### Lambda Deployment Package

```bash
# Create deployment package for QR Lambda
mkdir lambda-qr
cd lambda-qr
pip install qrcode pillow boto3 -t .
cp lambda_qr_generator.py .
zip -r lambda-qr.zip .

# Upload to Lambda via AWS Console or CLI
aws lambda create-function \
  --function-name cibf-qr-generator \
  --runtime python3.11 \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler lambda_qr_generator.lambda_handler \
  --zip-file fileb://lambda-qr.zip \
  --timeout 30 \
  --memory-size 256
```

---

## 📝 Updated Reservation Service (Invoke Lambda)

```java
// ReservationService.java
@Service
@Slf4j
public class ReservationService {
    
    @Value("${aws.sns.topic.arn}")
    private String snsTopicArn;
    
    @Value("${aws.lambda.qr.function}")
    private String qrLambdaFunction;
    
    private final AmazonSNS snsClient;
    private final AWSLambda lambdaClient;
    
    @Transactional
    public Reservation createReservation(ReservationRequest request) {
        // Save reservation to database
        Reservation reservation = reservationRepository.save(newReservation);
        
        // Invoke Lambda to generate QR code
        String qrCodeUrl = generateQRCode(reservation);
        
        // Publish SNS notification for email
        sendEmailNotification(reservation, qrCodeUrl);
        
        return reservation;
    }
    
    private String generateQRCode(Reservation reservation) {
        try {
            // Prepare payload
            Map<String, Object> payload = Map.of(
                "reservationId", reservation.getId(),
                "qrData", buildQRData(reservation)
            );
            
            // Invoke Lambda
            InvokeRequest invokeRequest = new InvokeRequest()
                .withFunctionName(qrLambdaFunction)
                .withPayload(new ObjectMapper().writeValueAsString(payload));
            
            InvokeResult result = lambdaClient.invoke(invokeRequest);
            
            // Parse response
            String responsePayload = new String(result.getPayload().array());
            Map<String, String> response = new ObjectMapper()
                .readValue(responsePayload, Map.class);
            
            return response.get("qrCodeUrl");
            
        } catch (Exception e) {
            log.error("Failed to generate QR code", e);
            throw new RuntimeException("QR generation failed");
        }
    }
    
    private void sendEmailNotification(Reservation reservation, String qrCodeUrl) {
        try {
            Map<String, Object> message = Map.of(
                "userEmail", reservation.getUser().getEmail(),
                "reservationId", reservation.getId(),
                "stalls", reservation.getStalls().stream()
                    .map(Stall::getName)
                    .collect(Collectors.toList()),
                "qrCodeUrl", qrCodeUrl
            );
            
            PublishRequest publishRequest = new PublishRequest()
                .withTopicArn(snsTopicArn)
                .withMessage(new ObjectMapper().writeValueAsString(message));
            
            snsClient.publish(publishRequest);
            
        } catch (Exception e) {
            log.error("Failed to send email notification", e);
        }
    }
}
```

---

## 💰 Cost Breakdown (Free Tier)

| Service | Free Tier Limit | Your Usage | Cost |
|---------|----------------|------------|------|
| **EC2 (t2.micro)** | 750 hrs/month | 730 hrs (1 instance) | **$0** |
| **RDS (db.t2.micro)** | 750 hrs/month | 730 hrs | **$0** |
| **RDS Storage** | 20GB SSD | 15GB used | **$0** |
| **S3 Storage** | 5GB | 2GB | **$0** |
| **S3 Requests** | 20K GET, 2K PUT | ~5K GET, ~500 PUT | **$0** |
| **Lambda** | 1M requests, 400K GB-sec | ~10K requests | **$0** |
| **CloudFront** | 50GB transfer | ~10GB | **$0** |
| **SNS** | 1,000 emails | ~200 emails | **$0** |
| **Data Transfer** | 100GB out | ~20GB | **$0** |

### 🎉 **Total Monthly Cost: $0.00**

---

## 🚀 Step-by-Step Deployment Guide

### Phase 1: AWS Account Setup

1. **Create AWS Account**
   - Sign up at https://aws.amazon.com/free/
   - Enable billing alerts
   - Set up budgets (set $5 alert to catch overages)

2. **Create IAM User**
   ```bash
   # Create user with programmatic access
   # Attach policies:
   # - AmazonEC2FullAccess
   # - AmazonRDSFullAccess
   # - AmazonS3FullAccess
   # - AWSLambdaFullAccess
   # - AmazonSNSFullAccess
   # - AmazonSESFullAccess
   ```

3. **Install AWS CLI**
   ```bash
   # macOS/Linux
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   
   # Configure
   aws configure
   # Enter: Access Key ID, Secret Key, Region (us-east-1), Format (json)
   ```

---

### Phase 2: RDS PostgreSQL Setup

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier cibf-database \
  --db-instance-class db.t2.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxx \
  --publicly-accessible \
  --backup-retention-period 7 \
  --engine-version 14.7

# Wait for creation (5-10 minutes)
aws rds wait db-instance-available --db-instance-identifier cibf-database

# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier cibf-database \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

**Connect and create databases:**
```bash
psql -h cibf-database.xxxx.rds.amazonaws.com -U postgres -d postgres

CREATE DATABASE auth_db;
CREATE DATABASE stall_db;
CREATE DATABASE reservation_db;
\q
```

---

### Phase 3: EC2 Instance Setup

```bash
# Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \  # Amazon Linux 2
  --instance-type t2.micro \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=cibf-server}]'

# SSH into instance
ssh -i your-key.pem ec2-user@your-ec2-public-ip

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
ssh -i your-key.pem ec2-user@your-ec2-public-ip
```

---

### Phase 4: Deploy Services

```bash
# Clone repository
git clone https://github.com/your-team/cibf-reservation.git
cd cibf-reservation

# Create .env file
cat > .env << EOF
RDS_ENDPOINT=cibf-database.xxxx.rds.amazonaws.com
DB_USERNAME=postgres
DB_PASSWORD=YourSecurePassword123!
JWT_SECRET=your-secret-key-here
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:xxxxx:cibf-notifications
QR_LAMBDA_FUNCTION=cibf-qr-generator
AWS_REGION=us-east-1
EOF

# Build and start services
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

---

### Phase 5: S3 Static Website Hosting

```bash
# Create S3 buckets
aws s3 mb s3://cibf-user-portal
aws s3 mb s3://cibf-employee-portal
aws s3 mb s3://cibf-qr-codes

# Enable static website hosting
aws s3 website s3://cibf-user-portal \
  --index-document index.html \
  --error-document index.html

aws s3 website s3://cibf-employee-portal \
  --index-document index.html \
  --error-document index.html

# Set bucket policy (public read)
cat > policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::cibf-user-portal/*"
  }]
}
EOF

aws s3api put-bucket-policy --bucket cibf-user-portal --policy file://policy.json
# Repeat for employee portal

# Build and deploy React apps
cd frontend/user-portal
npm run build
aws s3 sync build/ s3://cibf-user-portal

cd ../employee-portal
npm run build
aws s3 sync build/ s3://cibf-employee-portal
```

**Access URLs:**
- User Portal: `http://cibf-user-portal.s3-website-us-east-1.amazonaws.com`
- Employee Portal: `http://cibf-employee-portal.s3-website-us-east-1.amazonaws.com`

---

### Phase 6: Lambda Functions

```bash
# Create execution role for Lambda
aws iam create-role \
  --role-name lambda-execution-role \
  --assume-role-policy-document file://trust-policy.json

# Attach policies
aws iam attach-role-policy \
  --role-name lambda-execution-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

aws iam attach-role-policy \
  --role-name lambda-execution-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonSESFullAccess

# Deploy QR Lambda
cd lambda/qr-generator
zip -r function.zip .
aws lambda create-function \
  --function-name cibf-qr-generator \
  --runtime python3.11 \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://function.zip \
  --timeout 30

# Deploy Email Lambda
cd ../email-notification
zip -r function.zip .
aws lambda create-function \
  --function-name cibf-email-notification \
  --runtime python3.11 \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://function.zip \
  --timeout 30
```

---

### Phase 7: SNS Setup

```bash
# Create SNS topic
aws sns create-topic --name cibf-notifications

# Subscribe Lambda to SNS
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:xxxxx:cibf-notifications \
  --protocol lambda \
  --notification-endpoint arn:aws:lambda:us-east-1:xxxxx:function:cibf-email-notification

# Add Lambda permission for SNS
aws lambda add-permission \
  --function-name cibf-email-notification \
  --statement-id sns-invoke \
  --action lambda:InvokeFunction \
  --principal sns.amazonaws.com \
  --source-arn arn:aws:sns:us-east-1:xxxxx:cibf-notifications
```

---

### Phase 8: SES Email Setup

```bash
# Verify email address (for sending)
aws ses verify-email-identity --email-address noreply@yourdomain.com

# Check verification status
aws ses get-identity-verification-attributes \
  --identities noreply@yourdomain.com

# Note: In SES sandbox, you can only send to verified emails
# Verify test emails:
aws ses verify-email-identity --email-address testuser@example.com
```

---

## 🧪 Testing the Complete Flow

### 1. Health Check
```bash
curl http://YOUR_EC2_IP/health
# Should return: OK

curl http://YOUR_EC2_IP/api/auth/health
curl http://YOUR_EC2_IP/api/stalls/health
```

### 2. Register User
```bash
curl -X POST http://YOUR_EC2_IP/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 3. Login
```bash
curl -X POST http://YOUR_EC2_IP/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Test123!"
  }'
  
# Copy the JWT token from response
```

### 4. Get Available Stalls
```bash
curl http://YOUR_EC2_IP/api/stalls/available \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Create Reservation
```bash
curl -X POST http://YOUR_EC2_IP/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "stallIds": [1, 2, 3],
    "preferredDate": "2025-12-15"
  }'
```

**Expected Flow:**
1. Reservation saved to database ✅
2. Lambda invoked to generate QR code ✅
3. QR code uploaded to S3 ✅
4. SNS notification published ✅
5. Email Lambda triggered ✅
6. Confirmation email sent via SES ✅

---

## 👥 Team Distribution (6 Members) - AWS Free Tier Architecture

### **Member 1: DevOps Lead + AWS Infrastructure + Authentication Service**
**Time**: 3-4 weeks

**Responsibilities:**

**Week 1-2: AWS Infrastructure Setup**
- Create AWS Free Tier account and configure billing alerts
- Launch EC2 t2.micro instance (Amazon Linux 2)
- Install Docker and Docker Compose on EC2
- Create RDS PostgreSQL db.t2.micro instance
- Set up 3 databases: auth_db, stall_db, reservation_db
- Configure Security Groups (EC2, RDS)
- Set up S3 buckets (user-portal, employee-portal, qr-codes)
- Create and configure CloudFront distributions
- Set up IAM roles and policies (least privilege)
- Write Nginx reverse proxy configuration
- Create Docker Compose file for all services

**Week 2-3: Lambda Functions & AWS Services**
- Create Email Notification Lambda (Python + SES)
- Create QR Code Generation Lambda (Python + ZXing)
- Set up AWS SNS topic for notifications
- Subscribe Email Lambda to SNS
- Configure AWS SES (verify sender email)
- Write Lambda deployment scripts
- Test Lambda functions independently

**Week 3-4: Authentication Service & CI/CD**
- Implement Authentication Service (Spring Boot)
- JWT token generation and validation (Spring Security)
- Password encryption (BCrypt)
- User and Employee login endpoints
- Token refresh mechanism
- Database schema and migrations (auth_db)
- Create Dockerfile for Auth Service
- Set up GitHub Actions CI/CD pipeline
- Deploy all services to EC2
- Configure environment variables securely

**Deliverables:**
- AWS infrastructure fully operational ($0/month)
- Single EC2 with all services running in Docker
- RDS with 3 databases accessible
- Lambda functions deployed and tested
- S3 + CloudFront ready for frontends
- Authentication Service working
- Nginx routing all services correctly
- CI/CD pipeline functional
- Infrastructure documentation complete

**Skills Required:**
- AWS (EC2, RDS, S3, Lambda, SNS, SES, IAM, CloudFront)
- Docker & Docker Compose
- Python (Lambda functions)
- Spring Boot & Spring Security
- Linux/Shell scripting
- GitHub Actions
- Nginx configuration

**Key Endpoints to Deliver:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/employee/login` - Employee login
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/validate` - Token validation (internal)

---

### **Member 2: Backend - Stall & Reservation Management**
**Time**: 3-4 weeks

**Responsibilities:**

**Week 1-2: Stall Service Development**
- Set up Spring Boot Stall Service project
- Design and implement stall database schema (stall_db)
- Create Stall entity with fields:
  - stallNumber, stallName, size (SMALL/MEDIUM/LARGE)
  - location, description, isAvailable, price
- Implement StallRepository (Spring Data JPA)
- Implement StallService with business logic:
  - Get all stalls
  - Get available stalls (filter by isAvailable=true)
  - Get stalls by size
  - Update stall availability (internal method)
- Create StallController with REST endpoints
- Add input validation and error handling
- Write unit tests (JUnit, Mockito)
- Create Dockerfile for Stall Service
- Document API with Swagger

**Week 2-4: Reservation Service Development**
- Set up Spring Boot Reservation Service project
- Design reservation database schema (reservation_db)
- Create Reservation entity with fields:
  - userId, reservationDate, status (PENDING/CONFIRMED/CANCELLED)
  - qrCodeUrl, createdAt, confirmedAt
- Create ReservationStall junction entity (many-to-many)
- Implement complex business logic:
  - **3 stalls maximum per reservation** validation
  - Check stall availability via REST call to Stall Service
  - Atomically reserve multiple stalls
  - Handle transaction rollback on failure
- Integrate AWS SDK for Java:
  - Invoke QR Lambda function (AWSLambdaClient)
  - Publish SNS notification (AmazonSNSClient)
- Implement reservation confirmation/cancellation
- Create REST endpoints for reservation CRUD
- Add comprehensive error handling
- Write integration tests (TestRestTemplate)
- Create Dockerfile for Reservation Service
- Document API endpoints

**Deliverables:**
- Stall Service fully functional and dockerized
- Reservation Service with AWS integrations
- Database schemas implemented with migrations
- Business rules enforced (3 stalls limit)
- Service-to-service communication working
- REST APIs documented
- Test coverage >75%
- Both services deployed on EC2

**Skills Required:**
- Spring Boot (REST, Data JPA, Transactions)
- PostgreSQL and database design
- AWS SDK for Java (Lambda, SNS)
- RestTemplate for inter-service calls
- Docker
- JUnit & Mockito testing
- API design best practices

**Key Endpoints to Deliver:**

*Stall Service:*
- `GET /api/stalls` - List all stalls
- `GET /api/stalls/{id}` - Get stall details
- `GET /api/stalls/available` - Get available stalls
- `GET /api/stalls/size/{size}` - Filter by size
- `PUT /api/stalls/{id}/reserve` - Reserve stall (internal)
- `PUT /api/stalls/{id}/release` - Release stall (internal)

*Reservation Service:*
- `POST /api/reservations` - Create reservation
- `GET /api/reservations/{id}` - Get reservation details
- `GET /api/reservations/user/{userId}` - User's reservations
- `PUT /api/reservations/{id}/confirm` - Confirm reservation
- `DELETE /api/reservations/{id}` - Cancel reservation

---

### **Member 3: Backend - User Service + Email/QR Lambda Functions**
**Time**: 2-3 weeks

**Responsibilities:**

**Week 1-2: User Service Development**
- Set up Spring Boot User Service project
- Design user profile schema (uses auth_db)
- Create UserProfile entity extending User:
  - phoneNumber, address, companyName
  - businessRegistration, preferredContactMethod
- Create Genre entity and UserGenre junction table
- Implement UserService with profile management
- Implement genre preference management
- Create REST endpoints for user operations
- Add validation and error handling
- Write unit tests
- Create Dockerfile for User Service
- Document API

**Week 2-3: Lambda Functions Development**
- **Email Notification Lambda (Python 3.11):**
  - Parse SNS message with reservation details
  - Create HTML email template with reservation info
  - Integrate AWS SES for email sending
  - Handle attachments (QR code link)
  - Error handling and logging
  - Create deployment package with dependencies
  - Deploy to AWS Lambda
  - Subscribe to SNS topic
  - Test end-to-end email flow

- **QR Code Generation Lambda (Python 3.11):**
  - Accept reservation data via invocation payload
  - Generate QR code using `qrcode` library
  - Encode reservation details in QR (JSON format)
  - Upload QR image to S3 bucket (cibf-qr-codes)
  - Set proper ACL (public-read)
  - Return S3 public URL
  - Handle errors gracefully
  - Create deployment package
  - Deploy to AWS Lambda
  - Test with sample data

**Week 3: Integration & Testing**
- Test User Service endpoints
- Test Lambda functions via AWS Console
- Test Lambda invocation from Reservation Service
- Test email delivery end-to-end
- Verify QR codes are stored in S3
- Document Lambda configuration
- Deploy User Service to EC2

**Deliverables:**
- User Service fully functional
- User profile management APIs
- Genre preference management
- Email Lambda deployed and working
- QR Lambda deployed and working
- Both Lambdas integrated with main flow
- Email templates designed
- QR codes generating and storing in S3
- Test coverage >75%
- Comprehensive documentation

**Skills Required:**
- Spring Boot (REST, Data JPA)
- Python 3.11 (for Lambda)
- AWS Lambda deployment
- AWS SES email configuration
- AWS S3 operations
- Python libraries: boto3, qrcode, Pillow
- Email template design (HTML/CSS)
- Docker

**Key Endpoints to Deliver:**

*User Service:*
- `GET /api/users/{id}` - Get user profile
- `PUT /api/users/{id}` - Update user profile
- `GET /api/users/{id}/genres` - Get user genres
- `POST /api/users/{id}/genres` - Add genre preference
- `DELETE /api/users/{id}/genres/{genreId}` - Remove genre

*Lambda Functions:*
- `cibf-email-notification` - Triggered by SNS
- `cibf-qr-generator` - Invoked by Reservation Service

---

### **Member 4: Frontend Lead - User Portal (Authentication & Core Features)**
**Time**: 3-4 weeks

**Responsibilities:**

**Week 1: Project Setup & Authentication**
- Set up React 18 + TypeScript + Vite project
- Configure Tailwind CSS or Material-UI
- Set up React Router v6
- Create project folder structure:
  ```
  src/
  ├── components/     # Reusable UI components
  ├── pages/          # Page components
  ├── contexts/       # Auth context, theme
  ├── hooks/          # Custom hooks
  ├── services/       # API services (axios)
  ├── types/          # TypeScript interfaces
  ├── utils/          # Helper functions
  └── App.tsx
  ```
- Implement Axios interceptors for JWT
- Create AuthContext for global auth state
- Implement JWT token storage (localStorage/sessionStorage)
- Implement token refresh logic
- Create protected route wrapper component

**Week 2: Authentication Pages**
- Design and implement Registration page:
  - Email, password, confirm password
  - First name, last name
  - Form validation (Formik or React Hook Form)
  - Loading states and error handling
  - Redirect to login after success
- Design and implement Login page:
  - Email and password fields
  - "Remember me" checkbox
  - Forgot password link (optional)
  - Error messages for invalid credentials
  - Redirect to dashboard after login
- Create Logout functionality
- Implement password strength indicator
- Add responsive design (mobile-first)

**Week 3: User Dashboard & Navigation**
- Create main layout component:
  - Header with logo and user menu
  - Navigation sidebar/menu
  - Footer
  - Responsive hamburger menu for mobile
- Create Dashboard/Home page:
  - Welcome message
  - Quick stats (user's reservations count)
  - Recent reservations list
  - Call-to-action buttons
- Create User Profile page:
  - Display user information
  - Edit profile form
  - Change password functionality
  - Profile picture upload (optional)

**Week 4: Genre Preferences & Polish**
- Create Genre Selection page:
  - Display available genres as cards/chips
  - Multi-select functionality
  - Save preferences button
  - Visual feedback for selected genres
- Implement "My Reservations" page structure:
  - List view of user reservations
  - Show reservation details, date, status
  - Display QR code preview
  - Filter by status (pending/confirmed)
- Add loading skeletons for better UX
- Implement error boundaries
- Add toast notifications (react-toastify)
- Write component tests (React Testing Library)
- Optimize performance (React.memo, useMemo)

**Deliverables:**
- Complete authentication flow (register, login, logout)
- JWT token management with auto-refresh
- Protected routes working
- Responsive navigation and layout
- User dashboard with basic info
- Profile management page
- Genre preferences page
- "My Reservations" page skeleton
- Clean, maintainable code with TypeScript
- Component documentation
- Unit tests for critical components

**Skills Required:**
- React 18 + TypeScript
- React Router v6
- State management (Context API or Redux)
- Form handling (Formik or React Hook Form)
- Tailwind CSS or Material-UI
- Axios for API calls
- React Testing Library
- Responsive design principles
- Git version control

**Key Features to Deliver:**
- `/register` - User registration
- `/login` - User login
- `/dashboard` - User dashboard
- `/profile` - User profile management
- `/genres` - Genre preferences
- `/reservations` - My reservations list
- Protected route wrapper
- JWT token management
- Error handling and notifications

---

### **Member 5: Frontend - User Portal (Stall Reservation & Booking Flow)**
**Time**: 3-4 weeks

**Responsibilities:**

**Week 1-2: Interactive Stall Map**
- Research and choose visualization approach:
  - Option 1: SVG with custom grid layout
  - Option 2: D3.js for interactive visualization
  - Option 3: React-based grid component
- Design stall map layout:
  - Grid representation of physical layout
  - Visual grouping by size (small/medium/large)
  - Color coding: Available (green), Reserved (red), Selected (blue)
- Implement StallMap component:
  - Fetch stalls data from API (`/api/stalls/available`)
  - Render stalls as interactive elements
  - Click/tap to select stalls
  - Display stall details on hover/click
  - Enforce 3-stall selection limit
  - Disable selection when limit reached
  - Show selected count indicator
- Add filters and search:
  - Filter by size (dropdown)
  - Filter by availability
  - Search by stall number/name
- Make fully responsive (mobile, tablet, desktop)

**Week 2-3: Reservation Booking Flow**
- Create multi-step booking wizard:
  - **Step 1: Select Stalls** (stall map)
  - **Step 2: Review Selection** (summary with prices)
  - **Step 3: Confirm Details** (user info, date)
  - **Step 4: Confirmation** (success message)
- Implement StallSelection page:
  - Integrate stall map component
  - Show selected stalls in sidebar
  - "Proceed to Review" button
- Implement ReviewReservation page:
  - Display selected stalls with details
  - Show total price calculation
  - "Edit Selection" and "Confirm" buttons
  - Terms and conditions checkbox
- Implement ConfirmReservation page:
  - Loading state during API call
  - Handle success/error responses
  - Display reservation confirmation
  - Show generated QR code
  - "Download QR Code" button
  - Email notification message
  - "Make Another Reservation" button

**Week 3-4: Reservation Management & QR Display**
- Enhance "My Reservations" page:
  - Fetch user's reservations (`/api/reservations/user/{userId}`)
  - Display as cards with key info
  - Status badges (Pending, Confirmed, Cancelled)
  - Click to view details
- Create ReservationDetails modal/page:
  - Full reservation information
  - List of reserved stalls
  - QR code display (large view)
  - Download QR code button
  - Cancel reservation button
- Implement QR code functionality:
  - Fetch QR from S3 URL
  - Display as image
  - Download QR as PNG file
  - Print QR functionality (optional)
- Add reservation cancellation:
  - Confirmation dialog
  - API call to cancel
  - Update UI on success
  - Show cancellation success message

**Week 4: Polish & Integration**
- Add comprehensive error handling
- Implement loading states for all API calls
- Add empty states (no reservations, no stalls)
- Implement pagination for reservations list
- Add animations and transitions (Framer Motion)
- Optimize images and assets
- Test across different devices and browsers
- Write integration tests for booking flow
- Performance optimization (lazy loading, code splitting)

**Deliverables:**
- Interactive stall map with selection
- Complete booking flow (4 steps)
- Reservation confirmation with QR code
- "My Reservations" page with full details
- QR code display and download
- Reservation cancellation
- Mobile-responsive design
- Error handling and loading states
- Smooth user experience
- Integration tests
- Component documentation

**Skills Required:**
- React + TypeScript (advanced)
- SVG/D3.js for visualization
- React state management
- Multi-step form handling
- Image handling and downloads
- Responsive design (Flexbox, Grid)
- Framer Motion or CSS animations
- API integration with Axios
- Browser APIs (download, print)
- User experience design

**Key Features to Deliver:**
- `/stalls` - Interactive stall map
- `/book` - Multi-step booking wizard
- `/reservations/:id` - Reservation details
- `/qr/:reservationId` - QR code display
- Stall selection with 3-stall limit
- QR code download functionality
- Reservation cancellation
- Real-time availability updates

---

### **Member 6: Frontend - Employee Portal + Deployment & Testing**
**Time**: 3-4 weeks

**Responsibilities:**

**Week 1-2: Employee Portal Development**
- Set up separate React + TypeScript project for employees
- Reuse components from User Portal where possible
- Implement Employee Login page:
  - Different UI from user login
  - Call `/api/auth/employee/login`
  - Store employee JWT token
  - Redirect to employee dashboard
- Create Employee Dashboard:
  - Display key metrics with charts:
    - Total reservations (all time)
    - Active reservations (confirmed)
    - Pending reservations (awaiting confirmation)
    - Stall occupancy rate (percentage)
    - Revenue statistics (if applicable)
  - Use Recharts or Chart.js for visualizations
  - Real-time updates with refresh button
  - Date range filter for statistics
- Implement Reservations Management page:
  - Data table with all reservations (React Table or MUI DataGrid)
  - Columns: ID, User, Stalls, Date, Status, Actions
  - Search functionality (by user name, stall number)
  - Filter by status (All, Pending, Confirmed, Cancelled)
  - Sort by columns
  - Pagination
  - "View Details" action button
  - "Confirm Reservation" button for pending
  - "Cancel Reservation" button
- Create Reservation Details modal:
  - Full reservation information
  - User details
  - Stalls reserved
  - QR code preview
  - Confirmation/cancellation actions
  - Activity log (created, confirmed, cancelled)

**Week 2-3: Additional Employee Features**
- Implement Users Management page:
  - Data table of all registered users
  - Columns: Name, Email, Registrations Count, Joined Date
  - Search and filter users
  - View user's reservation history
  - User profile details modal
- Implement Stalls Overview page:
  - View all stalls in table format
  - Filter by availability, size
  - Visual stall map (can reuse from user portal)
  - Update stall information (admin feature)
- Add navigation and layout:
  - Sidebar with menu items
  - Header with employee info and logout
  - Breadcrumbs navigation
  - Responsive design for tablets

**Week 3: Deployment & S3 Configuration**
- **Deploy User Portal:**
  - Create production build: `npm run build`
  - Configure environment variables (API_URL)
  - Upload to S3 bucket: `cibf-user-portal`
  - Enable static website hosting
  - Set bucket policy for public read
  - Configure CloudFront distribution
  - Set up custom domain (optional)
  - Configure HTTPS via CloudFront
  - Test deployed application
  - Set up automatic deployment via GitHub Actions

- **Deploy Employee Portal:**
  - Build employee portal
  - Upload to S3 bucket: `cibf-employee-portal`
  - Configure CloudFront distribution
  - Test deployed application
  - Set up CI/CD for employee portal

**Week 3-4: End-to-End Testing & Documentation**
- Set up Cypress or Playwright for E2E tests
- Write E2E test scenarios:
  - **User Journey Tests:**
    - Register → Login → Browse Stalls → Make Reservation → View QR
    - Login → Cancel Reservation
    - Update Profile → Add Genres
  - **Employee Journey Tests:**
    - Employee Login → View Dashboard
    - View Reservations → Confirm Reservation
    - Search Users → View User Details
- Test API integrations for all endpoints
- Test error scenarios (network failures, validation errors)
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile device testing (responsive design)
- Performance testing (Lighthouse scores)
- Accessibility testing (WCAG compliance)
- Write comprehensive documentation:
  - User Manual (how to use user portal)
  - Employee Manual (how to use employee portal)
  - Deployment Guide
  - API Integration Guide
  - Troubleshooting Common Issues
  - Screenshots and video walkthrough
- Create README files for both portals
- Document environment variables
- Create team contributions document

**Deliverables:**
- Complete Employee Portal deployed on S3 + CloudFront
- Dashboard with real-time statistics and charts
- Reservations management with confirm/cancel actions
- Users management page
- Stalls overview page
- Both portals deployed and accessible via HTTPS
- CI/CD pipelines for automatic deployment
- Comprehensive E2E test suite (>20 tests)
- Full documentation (user, employee, technical)
- Video demo of complete system
- Team contributions report

**Skills Required:**
- React + TypeScript
- Data visualization (Recharts, Chart.js)
- Data tables (React Table, MUI DataGrid)
- Cypress or Playwright (E2E testing)
- AWS S3 and CloudFront deployment
- GitHub Actions (CI/CD)
- Technical writing and documentation
- Video recording and editing (for demo)
- Cross-browser testing
- Performance optimization

**Key Features to Deliver:**

*Employee Portal:*
- `/employee/login` - Employee authentication
- `/employee/dashboard` - Statistics and charts
- `/employee/reservations` - Manage all reservations
- `/employee/users` - View all users
- `/employee/stalls` - Stalls overview
- Search, filter, and pagination
- Confirm/cancel reservations

*Deployment:*
- User Portal: https://xxxxx.cloudfront.net (or custom domain)
- Employee Portal: https://yyyyy.cloudfront.net (or custom domain)
- CI/CD pipelines operational

*Testing & Docs:*
- E2E test suite with >90% coverage
- User Manual (PDF)
- Employee Manual (PDF)
- Technical Documentation
- Demo video (5-10 minutes)

---

## 📅 Development Timeline (7 Weeks)

### Week 1: Infrastructure & Setup
- **Member 1**: Complete AWS setup, RDS, EC2 ready
- **All Members**: Set up local dev environment, review architecture
- **Deliverable**: AWS infrastructure operational

### Week 2: Authentication & Foundation
- **Member 1**: Deploy Lambda functions, SNS/SES setup
- **Member 2**: Complete Authentication Service
- **Member 3**: Start Stall Service
- **Deliverable**: Auth service working, can create users

### Week 3: Core Services
- **Member 2**: Polish Auth service, add refresh tokens
- **Member 3**: Complete Stall + User Services
- **Member 4**: Start Reservation Service
- **Member 5**: Start User Portal (authentication pages)
- **Deliverable**: All backend services have basic endpoints

### Week 4: Integration
- **Member 3**: Deploy Stall + User Services to EC2
- **Member 4**: Complete Reservation Service with Lambda/SNS integration
- **Member 5**: User Portal stall browsing
- **Member 6**: Start Employee Portal
- **Deliverable**: All backend services deployed and communicating

### Week 5: Frontend Development
- **Member 4**: Test and fix Reservation Service edge cases
- **Member 5**: Complete User Portal (reservation flow, QR display)
- **Member 6**: Complete Employee Portal dashboard
- **Deliverable**: Both portals functional locally

### Week 6: Deployment & Testing
- **Member 1**: Help with CI/CD, monitoring setup
- **Member 5**: Deploy User Portal to S3 + CloudFront
- **Member 6**: Deploy Employee Portal, write E2E tests
- **All Members**: Integration testing
- **Deliverable**: Both portals live on S3

### Week 7: Polish & Documentation
- **All Members**: 
  - Bug fixes
  - Performance optimization
  - Security review
  - Complete documentation
  - Prepare demo for viva
- **Deliverable**: Production-ready system

---

## 🔒 Security Checklist

### 1. **AWS IAM**
```bash
# Create service-specific IAM roles
# Principle of least privilege

# EC2 instance role
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "rds:DescribeDBInstances",
      "s3:PutObject",
      "s3:GetObject",
      "lambda:InvokeFunction",
      "sns:Publish"
    ],
    "Resource": "*"
  }]
}
```

### 2. **Security Groups**
```bash
# RDS Security Group
- Inbound: PostgreSQL (5432) from EC2 security group only
- Outbound: All traffic

# EC2 Security Group
- Inbound: 
  - HTTP (80) from 0.0.0.0/0
  - SSH (22) from YOUR_IP only
- Outbound: All traffic

# Lambda Security Group (if in VPC)
- Outbound: HTTPS (443) for SES, S3
```

### 3. **Environment Variables**
```bash
# Never commit to Git!
# Use .env files (add to .gitignore)

# On EC2, use secure storage
sudo mkdir /opt/secrets
sudo chmod 700 /opt/secrets
echo "DB_PASSWORD=xyz" > /opt/secrets/.env
sudo chmod 600 /opt/secrets/.env

# Load in docker-compose.yml
env_file:
  - /opt/secrets/.env
```

### 4. **HTTPS (Optional - Not Free)**
```bash
# For production, add HTTPS:
# - Get domain from Namecheap (~$10/year)
# - Use AWS Certificate Manager (Free)
# - Configure CloudFront with SSL
# - Update Nginx to redirect HTTP to HTTPS
```

### 5. **Database Security**
```sql
-- Strong passwords
-- Rotate credentials every 90 days
-- Use SSL connections

-- In application.properties
spring.datasource.url=jdbc:postgresql://...?sslmode=require
```

---

## 📊 Monitoring & Logging

### CloudWatch Dashboards (Free Tier: 3 dashboards)

```bash
# Create CloudWatch dashboard
aws cloudwatch put-dashboard \
  --dashboard-name CIBF-Monitoring \
  --dashboard-body file://dashboard.json
```

**dashboard.json:**
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/EC2", "CPUUtilization", {"stat": "Average"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "EC2 CPU Usage"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/RDS", "DatabaseConnections"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "RDS Connections"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Invocations", {"stat": "Sum"}]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "Lambda Invocations"
      }
    }
  ]
}
```

### Application Logging

```java
// Use Logback configuration
// logback-spring.xml

<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>/var/log/cibf/application.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>/var/log/cibf/application.%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>7</maxHistory>
        </rollingPolicy>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <root level="INFO">
        <appender-ref ref="STDOUT" />
        <appender-ref ref="FILE" />
    </root>
</configuration>
```

### Docker Logs

```bash
# View logs on EC2
docker-compose logs -f reservation-service
docker-compose logs --tail=100 auth-service

# Export logs to CloudWatch (optional)
# Configure Docker logging driver
```

---

## 🚨 Staying Within Free Tier Limits

### Monthly Checklist

```
✅ EC2 Instance Hours
   - 1 t2.micro = 730 hours/month
   - Stop instance when not in use (testing periods)
   - Limit: 750 hours ✓

✅ RDS Instance Hours
   - 1 db.t2.micro = 730 hours/month
   - Can stop for up to 7 days
   - Limit: 750 hours ✓

✅ RDS Storage
   - 15GB < 20GB limit ✓

✅ S3 Storage
   - QR codes + Frontend assets < 5GB
   - Monitor: aws s3 ls --summarize --recursive s3://bucket-name

✅ S3 Requests
   - GET: ~5K/month < 20K limit ✓
   - PUT: ~500/month < 2K limit ✓

✅ Lambda
   - ~10K invocations < 1M limit ✓
   - Memory: 256MB, ~20 sec/invocation
   - Compute: ~50 GB-seconds < 400K limit ✓

✅ CloudFront
   - Data transfer: ~10GB < 50GB limit ✓

✅ SNS
   - Email notifications: ~200/month < 1000 limit ✓

✅ Data Transfer Out
   - Total: ~20GB < 100GB limit ✓
```

### Cost Alerts Setup

```bash
# Create billing alarm
aws cloudwatch put-metric-alarm \
  --alarm-name billing-alert \
  --alarm-description "Alert if bill exceeds $5" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --evaluation-periods 1 \
  --threshold 5.0 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:xxxxx:billing-alerts

# Subscribe to SNS for email alerts
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:xxxxx:billing-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com
```

---

## 🎯 Common Issues & Solutions

### Issue 1: EC2 Instance Running Out of Memory
**Symptom**: Docker containers crashing, OOM errors

**Solution**:
```bash
# Add swap space
sudo dd if=/dev/zero of=/swapfile bs=1M count=1024
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize JVM memory
# In Dockerfile
ENV JAVA_OPTS="-Xmx256m -Xms128m"
```

### Issue 2: RDS Connection Refused
**Symptom**: Services can't connect to RDS

**Solution**:
```bash
# Check security group
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Ensure:
# 1. RDS security group allows 5432 from EC2 security group
# 2. RDS is publicly accessible (for testing only!)
# 3. VPC routing is correct

# Test connection from EC2
psql -h cibf-database.xxx.rds.amazonaws.com -U postgres -d auth_db
```

### Issue 3: Lambda Timeout
**Symptom**: QR code generation fails

**Solution**:
```python
# Increase timeout in Lambda configuration
aws lambda update-function-configuration \
  --function-name cibf-qr-generator \
  --timeout 60 \
  --memory-size 512

# Optimize code (use smaller QR codes)
qr = qrcode.QRCode(version=1, box_size=5, border=2)  # Smaller
```

### Issue 4: SES Emails Not Sending
**Symptom**: Email notifications not received

**Solution**:
```bash
# Verify sender email
aws ses verify-email-identity --email-address noreply@yourdomain.com

# Check verification status
aws ses get-identity-verification-attributes \
  --identities noreply@yourdomain.com

# In SES Sandbox, verify recipient emails too
aws ses verify-email-identity --email-address testuser@example.com

# Request production access (if needed)
# https://console.aws.amazon.com/ses/home#/account
```

### Issue 5: Frontend Can't Connect to Backend
**Symptom**: CORS errors, 502 Bad Gateway

**Solution**:
```javascript
// Update React .env files
// .env.production
REACT_APP_API_URL=http://YOUR_EC2_PUBLIC_IP

// Rebuild and redeploy
npm run build
aws s3 sync build/ s3://cibf-user-portal

// Check Nginx CORS headers
# Add to nginx.conf
add_header 'Access-Control-Allow-Origin' '*' always;
```

---

## 📚 Documentation Structure

```
docs/
├── 01-Architecture-Overview.md
│   - System architecture diagram
│   - Technology stack
│   - Service breakdown
│
├── 02-API-Documentation.md
│   - All API endpoints
│   - Request/response examples
│   - Authentication flow
│
├── 03-Database-Schema.md
│   - ER diagrams
│   - Table structures
│   - Relationships
│
├── 04-Deployment-Guide.md
│   - AWS setup steps
│   - Docker deployment
│   - CI/CD pipeline
│
├── 05-User-Manual.md
│   - User portal guide
│   - Employee portal guide
│   - Screenshots
│
├── 06-Testing-Documentation.md
│   - Test cases
│   - Test results
│   - Coverage reports
│
├── 07-Team-Contributions.md
│   - Individual contributions
│   - Git commit history
│   - Workload distribution
│
└── 08-Demo-Script.md
    - Viva demonstration flow
    - Key features to showcase
    - Q&A preparation
```

---

## 🎬 Demo Script for Viva

### 1. Architecture Overview (2 minutes)
- Show architecture diagram
- Explain microservices approach
- Highlight AWS Free Tier usage

### 2. Live Demo - User Journey (5 minutes)
```
Step 1: User Registration
- Open User Portal (CloudFront URL)
- Register new user
- Show email verification (optional)

Step 2: Login & Browse Stalls
- Login with credentials
- Browse interactive stall map
- Filter by genre/availability

Step 3: Make Reservation
- Select 3 stalls
- Submit reservation
- Show loading state

Step 4: Confirmation
- Display reservation details
- Show QR code generated
- Check email notification

Step 5: View My Reservations
- Navigate to "My Reservations"
- Show reservation history
```

### 3. Live Demo - Employee Portal (3 minutes)
```
Step 1: Employee Login
- Login to Employee Portal
- Show dashboard with statistics

Step 2: Manage Reservations
- View all reservations
- Search/filter functionality
- Confirm reservation

Step 3: User Management
- View registered users
- Check user details
```

### 4. Backend Showcase (3 minutes)
```
- SSH into EC2 instance
- Show Docker containers running
- Check logs: docker-compose logs
- Show database connections
- Display CloudWatch metrics
```

### 5. Q&A Preparation
**Expected Questions:**
1. Why microservices over monolith?
2. How do you handle service failures?
3. Security measures implemented?
4. Scalability of the system?
5. Cost optimization strategies?
6. Database design rationale?
7. How do services communicate?
8. CI/CD implementation?

---

## ✅ Final Checklist Before Submission

### Code Quality
- [ ] All services have >75% test coverage
- [ ] Code follows consistent style (Checkstyle/ESLint)
- [ ] No hardcoded credentials
- [ ] All TODOs resolved
- [ ] Code reviewed by peers

### Documentation
- [ ] README.md complete with setup instructions
- [ ] API documentation (Swagger) accessible
- [ ] Architecture diagrams included
- [ ] Database schema documented
- [ ] Deployment guide complete
- [ ] Team contributions documented

### Deployment
- [ ] All services running on EC2
- [ ] RDS database accessible
- [ ] Both frontends live on S3 + CloudFront
- [ ] Lambda functions working
- [ ] Email notifications sending
- [ ] QR codes generating and storing

### Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Manual testing complete
- [ ] Load testing done (basic)

### Security
- [ ] Environment variables secured
- [ ] Security groups configured correctly
- [ ] Passwords encrypted (BCrypt)
- [ ] JWT authentication working
- [ ] HTTPS configured (optional)

### AWS
- [ ] Billing alerts set up
- [ ] Within Free Tier limits
- [ ] CloudWatch monitoring active
- [ ] IAM roles configured properly
- [ ] Backup strategy in place

---

## 🎓 Learning Resources

### AWS Free Tier
- https://aws.amazon.com/free/
- https://docs.aws.amazon.com/

### Spring Boot Microservices
- https://spring.io/guides
- https://www.baeldung.com/spring-boot

### Docker
- https://docs.docker.com/get-started/
- https://www.docker.com/101-tutorial

### React
- https://react.dev/learn
- https://react-typescript-cheatsheet.netlify.app/

### AWS Lambda
- https://docs.aws.amazon.com/lambda/
- https://aws.amazon.com/lambda/getting-started/

---

## 💡 Pro Tips

1. **Start Small**: Get one service working end-to-end before scaling
2. **Version Control**: Commit often, use meaningful commit messages
3. **Test Locally First**: Use Docker Compose before deploying to AWS
4. **Monitor Costs**: Check AWS billing dashboard daily
5. **Document As You Go**: Don't leave documentation for last week
6. **Backup Databases**: Take RDS snapshots before major changes
7. **Use Free SSL**: CloudFront provides free HTTPS
8. **Optimize Images**: Reduce Docker image sizes for faster deployments
9. **Cache Dependencies**: Use Docker layer caching in CI/CD
10. **Practice Demo**: Run through viva demo multiple times

---

## 📞 Support & Resources

### AWS Support
- Free Tier FAQ: https://aws.amazon.com/free/free-tier-faqs/
- Support Forums: https://forums.aws.amazon.com/
- Cost Calculator: https://calculator.aws/

### Community Help
- Stack Overflow: https://stackoverflow.com/
- GitHub Discussions: Your repo's discussion tab
- Discord/Slack: Create team channel

### Emergency Contacts
- AWS Support (Free Tier): Limited to account/billing issues
- Team Lead: [contact info]
- Project Supervisor: [contact info]

---

## 🎉 Success Criteria

Your project is successful if:
- ✅ All services deployed and accessible
- ✅ User can make reservations end-to-end
- ✅ QR codes generate and emails send
- ✅ Employee portal shows statistics
- ✅ System runs within AWS Free Tier
- ✅ Documentation is complete
- ✅ Demo runs smoothly
- ✅ Team can answer technical questions
- ✅ Code quality is high
- ✅ No critical bugs

---

## 🚀 Good Luck!

This architecture gives you production-grade experience while staying completely free. The skills you'll learn (Docker, AWS, microservices, CI/CD) are highly valued in the industry.

**Remember**: Start with infrastructure (Week 1), get all services talking to each other (Week 2-4), polish frontends (Week 5-6), and test everything (Week 7).

**Final Advice**: Communication is key. Have daily standups, use Git properly, and help each other when stuck.

---

## Appendix: Quick Command Reference

```bash
# AWS CLI Quick Commands
aws ec2 describe-instances --output table
aws rds describe-db-instances --output table
aws s3 ls
aws lambda list-functions

# Docker Commands
docker-compose up -d
docker-compose logs -f service-name
docker-compose restart service-name
docker-compose down

# Database Commands
psql -h RDS_ENDPOINT -U postgres -d auth_db
\dt  # List tables
\d table_name  # Describe table

# Git Commands
git status
git add .
git commit -m "message"
git push origin main
git pull origin main

# SSH to EC2
ssh -i key.pem ec2-user@ec2-ip

# Check Service Health
curl http://EC2_IP/health
curl http://EC2_IP/api/auth/health
```

---

**Total Free Tier Cost: $0.00/month** ✅
    