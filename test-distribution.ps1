# Quick Test Script for Schemock Distribution Packages
# Tests all build outputs for correctness

param(
    [switch]$SkipInstaller,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "🧪 Schemock Distribution Test Suite" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$version = (Get-Content package.json | ConvertFrom-Json).version
$distDir = "releases\distribution-$version"
$testResults = @{
    Total = 0
    Passed = 0
    Failed = 0
    Skipped = 0
    Tests = @()
}

function Test-Step {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [switch]$Optional
    )
    
    $testResults.Total++
    Write-Host "  Testing: $Name..." -NoNewline
    
    try {
        $result = & $Test
        if ($result -eq $false) {
            throw "Test returned false"
        }
        Write-Host " ✅ PASS" -ForegroundColor Green
        $testResults.Passed++
        $testResults.Tests += @{ Name = $Name; Status = "PASS" }
    }
    catch {
        if ($Optional) {
            Write-Host " ⚠️  SKIP (Optional)" -ForegroundColor Yellow
            $testResults.Skipped++
            $testResults.Tests += @{ Name = $Name; Status = "SKIP"; Error = $_.Exception.Message }
        }
        else {
            Write-Host " ❌ FAIL" -ForegroundColor Red
            if ($Verbose) {
                Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
            }
            $testResults.Failed++
            $testResults.Tests += @{ Name = $Name; Status = "FAIL"; Error = $_.Exception.Message }
        }
    }
}

# Test 1: Distribution directory exists
Write-Host "📁 Checking Distribution Directory" -ForegroundColor Yellow
Test-Step "Distribution directory exists" {
    Test-Path $distDir
}

# Test 2: Base package
Write-Host "`n📦 Checking Base Package" -ForegroundColor Yellow
Test-Step "Base package directory exists" {
    Test-Path "$distDir\schemock-$version"
}

Test-Step "Executable exists in base package" {
    Test-Path "$distDir\schemock-$version\schemock.exe"
}

Test-Step "README.md exists" {
    Test-Path "$distDir\schemock-$version\README.md"
}

Test-Step "version.json exists" {
    Test-Path "$distDir\schemock-$version\version.json"
}

Test-Step "Documentation folder exists" {
    Test-Path "$distDir\schemock-$version\docs"
}

Test-Step "Examples folder exists" {
    Test-Path "$distDir\schemock-$version\examples"
}

# Test 3: Installer
if (-not $SkipInstaller) {
    Write-Host "`n🔧 Checking Installer Package" -ForegroundColor Yellow
    Test-Step "Installer executable exists" {
        Test-Path "$distDir\Schemock-Setup.exe"
    } -Optional

    Test-Step "Installer size is reasonable" {
        $file = Get-Item "$distDir\Schemock-Setup.exe" -ErrorAction SilentlyContinue
        if ($file) {
            $sizeMB = $file.Length / 1MB
            ($sizeMB -gt 10) -and ($sizeMB -lt 200)
        }
        else { $false }
    } -Optional
}
else {
    Write-Host "`n🔧 Skipping Installer Tests" -ForegroundColor Yellow
}

# Test 4: Portable package
Write-Host "`n📱 Checking Portable Package" -ForegroundColor Yellow
Test-Step "Portable ZIP exists" {
    Test-Path "$distDir\schemock-$version-portable.zip"
}

Test-Step "Portable ZIP size is reasonable" {
    $file = Get-Item "$distDir\schemock-$version-portable.zip"
    $sizeMB = $file.Length / 1MB
    ($sizeMB -gt 10) -and ($sizeMB -lt 200)
}

# Test 5: Checksums
Write-Host "`n🔐 Checking Checksums" -ForegroundColor Yellow
Test-Step "Checksums JSON exists" {
    Test-Path "$distDir\checksums-$version.json"
}

Test-Step "SHA256SUMS.txt exists" {
    Test-Path "$distDir\SHA256SUMS.txt"
}

Test-Step "Checksums JSON is valid" {
    $checksums = Get-Content "$distDir\checksums-$version.json" | ConvertFrom-Json
    ($null -ne $checksums.files) -and ($checksums.files.PSObject.Properties.Count -gt 0)
}

# Test 6: Build reports
Write-Host "`n📊 Checking Build Reports" -ForegroundColor Yellow
Test-Step "BUILD-REPORT.json exists" {
    Test-Path "$distDir\BUILD-REPORT.json"
}

Test-Step "BUILD-SUMMARY.txt exists" {
    Test-Path "$distDir\BUILD-SUMMARY.txt"
}

Test-Step "BUILD-REPORT.json is valid" {
    $report = Get-Content "$distDir\BUILD-REPORT.json" | ConvertFrom-Json
    ($null -ne $report.version) -and ($report.version -eq $version)
}

# Test 7: Verify executable
Write-Host "`n⚙️  Testing Executable" -ForegroundColor Yellow
Test-Step "Executable runs --version" {
    $output = & "$distDir\schemock-$version\schemock.exe" --version 2>&1
    $output -match $version
}

Test-Step "Executable shows help" {
    $output = & "$distDir\schemock-$version\schemock.exe" --help 2>&1
    $output -match "Usage:"
}

# Test 8: Verify portable contents
Write-Host "`n📦 Testing Portable Package Contents" -ForegroundColor Yellow
Test-Step "Can extract portable ZIP" {
    $tempDir = Join-Path $env:TEMP "schemock-test-$(Get-Random)"
    try {
        Expand-Archive -Path "$distDir\schemock-$version-portable.zip" -DestinationPath $tempDir -Force
        $result = Test-Path "$tempDir\schemock.exe"
        Remove-Item $tempDir -Recurse -Force
        $result
    }
    catch {
        if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
        throw
    }
}

Test-Step "Portable package contains launchers" {
    $tempDir = Join-Path $env:TEMP "schemock-test-$(Get-Random)"
    try {
        Expand-Archive -Path "$distDir\schemock-$version-portable.zip" -DestinationPath $tempDir -Force
        $hasLaunchers = (Test-Path "$tempDir\schemock-portable.bat") -and 
                       (Test-Path "$tempDir\schemock-portable.ps1") -and
                       (Test-Path "$tempDir\quick-start.bat")
        Remove-Item $tempDir -Recurse -Force
        $hasLaunchers
    }
    catch {
        if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
        throw
    }
}

# Summary
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Tests:   $($testResults.Total)" -ForegroundColor White
Write-Host "Passed:        $($testResults.Passed)" -ForegroundColor Green
Write-Host "Failed:        $($testResults.Failed)" -ForegroundColor $(if ($testResults.Failed -gt 0) { "Red" } else { "Green" })
Write-Host "Skipped:       $($testResults.Skipped)" -ForegroundColor Yellow
Write-Host ""

if ($testResults.Failed -gt 0) {
    Write-Host "❌ FAILED TESTS:" -ForegroundColor Red
    $testResults.Tests | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
        Write-Host "  - $($_.Name)" -ForegroundColor Red
        if ($Verbose -and $_.Error) {
            Write-Host "    Error: $($_.Error)" -ForegroundColor DarkRed
        }
    }
    Write-Host ""
    Write-Host "Build verification FAILED. Please fix errors and rebuild." -ForegroundColor Red
    exit 1
}
elseif ($testResults.Skipped -gt 0) {
    Write-Host "⚠️  SKIPPED TESTS:" -ForegroundColor Yellow
    $testResults.Tests | Where-Object { $_.Status -eq "SKIP" } | ForEach-Object {
        Write-Host "  - $($_.Name)" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "✅ Build verification PASSED (with optional tests skipped)" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "✅ All tests PASSED! Distribution is ready." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Review BUILD-SUMMARY.txt" -ForegroundColor White
    Write-Host "  2. Test on clean systems" -ForegroundColor White
    Write-Host "  3. Create GitHub release" -ForegroundColor White
    Write-Host "  4. Upload distribution files" -ForegroundColor White
    Write-Host ""
    exit 0
}
