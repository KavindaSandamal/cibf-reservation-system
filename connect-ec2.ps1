Write-Host "Checking EC2 instance status..." -ForegroundColor Cyan

$INSTANCE_ID = "i-03f8342de6a3a4e7c"

# Get current state and IP
$instanceInfo = aws ec2 describe-instances `
  --instance-ids $INSTANCE_ID `
  --query 'Reservations[0].Instances[0].[State.Name,PublicIpAddress]' `
  --output text

$state, $ip = $instanceInfo -split '\s+'

Write-Host "Current State: $state" -ForegroundColor Yellow
Write-Host "Current IP: $ip" -ForegroundColor Yellow

# Check if stopped
if ($state -eq "stopped") {
    Write-Host "`n⚠️ Instance is STOPPED. Starting it now..." -ForegroundColor Red
    aws ec2 start-instances --instance-ids $INSTANCE_ID | Out-Null
    
    Write-Host "⏳ Waiting for instance to start (1-2 minutes)..." -ForegroundColor Yellow
    aws ec2 wait instance-running --instance-ids $INSTANCE_ID
    
    # Get new IP after starting
    $ip = aws ec2 describe-instances `
      --instance-ids $INSTANCE_ID `
      --query 'Reservations[0].Instances[0].PublicIpAddress' `
      --output text
    
    Write-Host "✅ Instance started!" -ForegroundColor Green
    Write-Host "New IP Address: $ip" -ForegroundColor Green
}
elseif ($state -eq "running") {
    Write-Host "✅ Instance is already running" -ForegroundColor Green
}
else {
    Write-Host "⚠️ Instance state: $state" -ForegroundColor Yellow
    Write-Host "Waiting for instance to be ready..." -ForegroundColor Yellow
    aws ec2 wait instance-running --instance-ids $INSTANCE_ID
    
    $ip = aws ec2 describe-instances `
      --instance-ids $INSTANCE_ID `
      --query 'Reservations[0].Instances[0].PublicIpAddress' `
      --output text
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Ready to Connect!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "IP Address: $ip" -ForegroundColor Cyan
Write-Host ""
Write-Host "SSH Command:" -ForegroundColor Yellow
Write-Host "ssh -i `"$env:USERPROFILE\.ssh\cibf-key.pem`" ec2-user@$ip" -ForegroundColor White
Write-Host ""

# Save current IP to file
@"
EC2 Current IP: $ip
Last Updated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

Connect with:
ssh -i "$env:USERPROFILE\.ssh\cibf-key.pem" ec2-user@$ip
"@ | Out-File -FilePath "ec2-current-ip.txt"

Write-Host "✅ IP saved to: ec2-current-ip.txt" -ForegroundColor Green
Write-Host ""
Write-Host "Attempting to connect..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Connect
ssh -i "$env:USERPROFILE\.ssh\cibf-key.pem" ec2-user@$ip