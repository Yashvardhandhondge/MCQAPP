# Test Registration Endpoint - PowerShell Script
# Usage: .\test-register.ps1

Write-Host "🧪 Testing Registration Endpoint..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8000"

# Test 1: Health Check
Write-Host "1️⃣ Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -ErrorAction Stop
    Write-Host "✅ Health check passed!" -ForegroundColor Green
    $healthResponse | ConvertTo-Json
} catch {
    Write-Host "❌ Health check failed - server might not be running" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""
Write-Host ""

# Test 2: Registration with valid data
Write-Host "2️⃣ Testing Registration with valid data..." -ForegroundColor Yellow
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$registerBody = @{
    fullName = "Test User"
    email = "test$timestamp@example.com"
    password = "testpassword123"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" `
        -Method Post `
        -Body $registerBody `
        -ContentType "application/json" `
        -Headers @{"Accept"="application/json"} `
        -ErrorAction Stop
    
    Write-Host "✅ Registration successful!" -ForegroundColor Green
    Write-Host "HTTP Status: 201 Created" -ForegroundColor Green
    $registerResponse | ConvertTo-Json -Depth 10
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ Registration failed!" -ForegroundColor Red
    Write-Host "HTTP Status: $statusCode" -ForegroundColor Red
    
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        $errorObj = $responseBody | ConvertFrom-Json
        Write-Host "Error Message: $($errorObj.message)" -ForegroundColor Red
        $errorObj | ConvertTo-Json
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""
Write-Host ""

# Test 3: Registration with missing fields
Write-Host "3️⃣ Testing Registration with missing fields (should fail)..." -ForegroundColor Yellow
$invalidBody = @{
    email = "test@example.com"
} | ConvertTo-Json

try {
    $invalidResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" `
        -Method Post `
        -Body $invalidBody `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "⚠️ Unexpected success!" -ForegroundColor Yellow
    $invalidResponse | ConvertTo-Json
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "✅ Correctly rejected invalid request" -ForegroundColor Green
    Write-Host "HTTP Status: $statusCode" -ForegroundColor Yellow
    
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        $errorObj = $responseBody | ConvertFrom-Json
        Write-Host "Error Message: $($errorObj.message)" -ForegroundColor Yellow
        $errorObj | ConvertTo-Json
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}
Write-Host ""
Write-Host ""

# Test 4: Test with IP address from config
Write-Host "4️⃣ Testing with IP address from frontend config (192.168.29.158)..." -ForegroundColor Yellow
$ipUrl = "http://192.168.29.158:8000"
$testBody = @{
    fullName = "IP Test User"
    email = "iptest$timestamp@example.com"
    password = "testpassword123"
} | ConvertTo-Json

try {
    $ipResponse = Invoke-RestMethod -Uri "$ipUrl/api/auth/register" `
        -Method Post `
        -Body $testBody `
        -ContentType "application/json" `
        -Headers @{"Accept"="application/json"} `
        -ErrorAction Stop
    
    Write-Host "✅ Registration via IP successful!" -ForegroundColor Green
    Write-Host "HTTP Status: 201 Created" -ForegroundColor Green
    $ipResponse | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Registration via IP failed!" -ForegroundColor Red
    Write-Host "This might be expected if server is only listening on localhost" -ForegroundColor Yellow
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Testing complete!" -ForegroundColor Cyan




