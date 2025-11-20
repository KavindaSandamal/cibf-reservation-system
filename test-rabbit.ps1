# EC2 instance ID
$INSTANCE_ID = 'i-03f8342de6a3a4e7c'

# Get public IP of the EC2 instance
$EC2_IP = aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].PublicIpAddress' --output text --region us-west-2

Write-Host 'Testing Complete RabbitMQ Flow'
Write-Host '================================='

# Step 1
Write-Host ''
Write-Host 'Step 1: Publishing reservation confirmed event...'
$response1 = Invoke-RestMethod -Uri ("http://{0}/api/test/rabbitmq/test-reservation" -f $EC2_IP) -Method Post
Write-Host $response1.message

Start-Sleep -Seconds 2

# Step 2
Write-Host ''
Write-Host 'Step 2: Publishing email event...'
$response2 = Invoke-RestMethod -Uri ("http://{0}/api/test/rabbitmq/test-email" -f $EC2_IP) -Method Post
Write-Host $response2.message

Start-Sleep -Seconds 2

# Step 3
Write-Host ''
Write-Host 'Step 3: Publishing QR generation event...'
$response3 = Invoke-RestMethod -Uri ("http://{0}/api/test/rabbitmq/test-qr" -f $EC2_IP) -Method Post
Write-Host $response3.message

# Summary
Write-Host ''
Write-Host 'All events published!'
Write-Host ("Check RabbitMQ UI: http://{0}:15672" -f $EC2_IP)
Write-Host 'Check logs: docker logs -f auth-service'
