# Simple Registration Test - PowerShell
# Quick test to see if registration endpoint works

$url = "http://localhost:8000/api/auth/register"
$body = @{
    fullName = "Test User"
    email = "test$(Get-Random)@example.com"
    password = "testpassword123"
} | ConvertTo-Json

Write-Host "Testing: POST $url" -ForegroundColor Cyan
Write-Host "Body: $body" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get error message from response
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Body: $errorBody" -ForegroundColor Yellow
    } catch {
        Write-Host "Could not read error body" -ForegroundColor Yellow
    }
}




