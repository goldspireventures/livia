# Install Maestro CLI on Windows (requires Java 17+).
# Run in PowerShell (Admin optional for setx):
#   .\scripts\install-maestro-windows.ps1
#
# After install: restart terminal, then:
#   pnpm --filter livia-mobile run ios
#   pnpm maestro:visual-capture

$ErrorActionPreference = "Stop"
$maestroDir = Join-Path $env:USERPROFILE ".maestro"
$binDir = Join-Path $maestroDir "bin"

Write-Host "Checking Java 17+..."
$javaExe = $null
if (Get-Command java -ErrorAction SilentlyContinue) {
  $javaExe = "java"
} else {
  $bundled = Get-ChildItem "C:\Program Files\Microsoft" -Directory -Filter "jdk-*" -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    Select-Object -First 1
  if ($bundled) {
    $javaExe = Join-Path $bundled.FullName "bin\java.exe"
  }
}
try {
  if (-not $javaExe) { throw "Java not found" }
  $javaVer = & $javaExe -version 2>&1 | Out-String
  if ($javaVer -notmatch 'version "(\d+)') { throw "Java not found" }
  $major = [int]$Matches[1]
  if ($major -lt 17) { throw "Need Java 17+, found $major" }
  Write-Host "  OK: $javaVer.Trim()"
} catch {
  Write-Host @"

Java 17+ required. Install one of:
  - winget install Microsoft.OpenJDK.17
  - https://adoptium.net/temurin/releases/?version=17

Then re-run this script.
"@
  exit 1
}

$zip = Join-Path $env:TEMP "maestro.zip"
$releaseUrl = "https://github.com/mobile-dev-inc/maestro/releases/latest/download/maestro.zip"
Write-Host "Downloading Maestro..."
Invoke-WebRequest -Uri $releaseUrl -OutFile $zip -UseBasicParsing
Expand-Archive -Path $zip -DestinationPath $maestroDir -Force
Remove-Item $zip -ErrorAction SilentlyContinue

$maestroExeDir = Join-Path $maestroDir "maestro\bin"
if (-not (Test-Path (Join-Path $maestroExeDir "maestro.bat"))) {
  Write-Host "ERROR: Expected $maestroExeDir\maestro.bat after extract."
  exit 1
}

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$maestroExeDir*") {
  [Environment]::SetEnvironmentVariable("Path", "$userPath;$maestroExeDir", "User")
  Write-Host "Added $maestroExeDir to user PATH (restart terminal)."
}

$jdkDir = Get-ChildItem "C:\Program Files\Microsoft" -Directory -Filter "jdk-*" -ErrorAction SilentlyContinue |
  Sort-Object Name -Descending |
  Select-Object -First 1
if ($jdkDir) {
  [Environment]::SetEnvironmentVariable("JAVA_HOME", $jdkDir.FullName, "User")
  $jdkBin = Join-Path $jdkDir.FullName "bin"
  if ($userPath -notlike "*$jdkBin*") {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$maestroExeDir;$jdkBin", "User")
  }
  Write-Host "JAVA_HOME -> $($jdkDir.FullName)"
}

Write-Host "Done. Verify: maestro -v"
Write-Host "Native captures: pnpm maestro:visual-capture"
