# Clean Build Directories
# Forcefully removes all build artifacts with proper Windows handling

param(
    [switch]$Force
)

Write-Host "🧹 Cleaning Schemock Build Directories" -ForegroundColor Cyan
Write-Host ""

$dirsToClean = @("dist", "releases", "coverage")
$cleaned = 0
$failed = 0

foreach ($dir in $dirsToClean) {
    if (Test-Path $dir) {
        Write-Host "  Removing $dir..." -NoNewline
        
        try {
            # First, try to unlock any files that might be locked
            if ($Force) {
                # Kill any processes that might be using files in these directories
                Get-Process | Where-Object { 
                    try {
                        $_.MainModule.FileName -like "*\$dir\*"
                    } catch {
                        $false
                    }
                } | ForEach-Object {
                    Write-Host " (stopping $($_.Name))" -NoNewline
                    Stop-Process $_.Id -Force -ErrorAction SilentlyContinue
                }
            }
            
            # Remove the directory with retries
            $retries = 3
            $success = $false
            
            for ($i = 0; $i -lt $retries; $i++) {
                try {
                    Remove-Item $dir -Recurse -Force -ErrorAction Stop
                    $success = $true
                    break
                } catch {
                    if ($i -lt ($retries - 1)) {
                        Start-Sleep -Milliseconds 500
                    }
                }
            }
            
            if ($success) {
                Write-Host " ✅" -ForegroundColor Green
                $cleaned++
            } else {
                throw "Failed after $retries attempts"
            }
        }
        catch {
            Write-Host " ❌" -ForegroundColor Red
            Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "    Try closing any programs that might be using these files" -ForegroundColor Yellow
            $failed++
        }
    } else {
        Write-Host "  $dir (not found, skipping)" -ForegroundColor DarkGray
    }
}

Write-Host ""

if ($failed -eq 0) {
    Write-Host "✅ Cleanup completed successfully!" -ForegroundColor Green
    Write-Host "   Removed $cleaned director$(if($cleaned -ne 1){'ies'}else{'y'})" -ForegroundColor White
    Write-Host ""
    Write-Host "You can now run: npm run build:distribution" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "⚠️  Cleanup completed with errors" -ForegroundColor Yellow
    Write-Host "   Cleaned: $cleaned" -ForegroundColor White
    Write-Host "   Failed: $failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Close Visual Studio Code and any file explorers" -ForegroundColor White
    Write-Host "  2. Close any running schemock processes" -ForegroundColor White
    Write-Host "  3. Run: .\clean-build.ps1 -Force" -ForegroundColor White
    Write-Host "  4. If still failing, restart your computer" -ForegroundColor White
    exit 1
}
