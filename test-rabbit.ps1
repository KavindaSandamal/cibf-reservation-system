$INSTANCE_ID = "i-03f8342de6a3a4e7c"
$EC2_IP = aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].PublicIpAddress' --output text --region us-west-2


Write-Host "🧪 Testing Complete RabbitMQ Flow" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Test 1: Send reservation event
Write-Host "`n📤 Step 1: Publishing reservation confirmed event..." -ForegroundColor Yellow
$response1 = Invoke-RestMethod -Uri "http://$EC2_IP/api/test/rabbitmq/test-reservation" -Method Post
Write-Host $response1.message -ForegroundColor Green

Start-Sleep -Seconds 2

# Test 2: Send email event
Write-Host "`n📧 Step 2: Publishing email event..." -ForegroundColor Yellow
$response2 = Invoke-RestMethod -Uri "http://$EC2_IP/api/test/rabbitmq/test-email" -Method Post
Write-Host $response2.message -ForegroundColor Green

Start-Sleep -Seconds 2

# Test 3: Send QR event
Write-Host "`n📱 Step 3: Publishing QR generation event..." -ForegroundColor Yellow
$response3 = Invoke-RestMethod -Uri "http://$EC2_IP/api/test/rabbitmq/test-qr" -Method Post
Write-Host $response3.message -ForegroundColor Green

Write-Host "`n✅ All events published!" -ForegroundColor Green
Write-Host "`nCheck RabbitMQ UI: http://$EC2_IP:15672" -ForegroundColor Cyan
Write-Host "Check logs: docker logs -f auth-service" -ForegroundColor Cyan