#!/usr/bin/env pwsh

# PowerShell script to generate dummy user data for MedTracker
Write-Host "🚀 MedTracker Dummy Data Generator" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

# Check if we're in the backend directory
$currentDir = Get-Location
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the backend directory" -ForegroundColor Red
    Write-Host "Current directory: $currentDir" -ForegroundColor Yellow
    Write-Host "Expected: Should contain package.json" -ForegroundColor Yellow
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found" -ForegroundColor Red
    Write-Host "Please make sure you have a .env file with MONGODB_URI configured" -ForegroundColor Yellow
    exit 1
}

Write-Host "📂 Current directory: $currentDir" -ForegroundColor Cyan
Write-Host "🔍 Checking dependencies..." -ForegroundColor Cyan

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Dependencies ready" -ForegroundColor Green
Write-Host "🔄 Starting dummy data generation..." -ForegroundColor Cyan
Write-Host ""

# Run the dummy data generation script
node scripts/runDummyData.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 Success! Dummy data has been generated." -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 What was created:" -ForegroundColor Cyan
    Write-Host "• 1 User with comprehensive profile" -ForegroundColor White
    Write-Host "• 6 Realistic medications" -ForegroundColor White
    Write-Host "• 6 Medication regimens with different schedules" -ForegroundColor White
    Write-Host "• ~4,500+ dose logs spanning 2 years" -ForegroundColor White
    Write-Host "• Realistic adherence patterns and data" -ForegroundColor White
    Write-Host ""
    Write-Host "🔐 Login Credentials:" -ForegroundColor Cyan
    Write-Host "Email: john.doe.medtracker@example.com" -ForegroundColor White
    Write-Host "Password: password123" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 You can now start your frontend and test with this data!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Failed to generate dummy data" -ForegroundColor Red
    Write-Host "Please check the error messages above" -ForegroundColor Yellow
}
