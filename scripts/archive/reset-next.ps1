Set-StrictMode -Version Latest
$projRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Push-Location $projRoot\..

Write-Host "1/3 - Trying to clean corrupted JSON manifests (if any)..."
if (Test-Path ".\scripts\clean-next-manifests.js") {
  try {
    node .\scripts\clean-next-manifests.js
  } catch {
    Write-Warning "clean-next-manifests.js failed or not present. Continuing..."
  }
} else {
  Write-Host "No clean-next-manifests.js found, skipping JSON check."
}

Write-Host "2/3 - Removing .next directory (if exists)..."
if (Test-Path ".next") {
  try {
    Remove-Item -Recurse -Force .next
    Write-Host ".next removed."
  } catch {
    Write-Warning "Failed to remove .next: $_. Exception. Try running PowerShell as Administrator."
  }
} else {
  Write-Host ".next not found."
}

Write-Host "3/3 - Starting dev server..."
# invoke npm via cmd to avoid PowerShell npm shim errors
cmd /c "npm run dev"

Pop-Location
