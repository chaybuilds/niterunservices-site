param(
  [string]$Repo = (Join-Path $env:USERPROFILE 'NiteRun\niterunservices-site')
)
$ErrorActionPreference = 'Stop'
if(-not (Test-Path (Join-Path $Repo '.git'))){
  Write-Error "Not a Git repository: $Repo"
  exit 2
}
Set-Location $Repo
$dirty = git status --porcelain
if($dirty){
  Write-Error 'Local changes detected. Commit or stash them before syncing; no force reset.'
  exit 2
}
git fetch origin main
if($LASTEXITCODE -ne 0){exit 2}
git pull --ff-only origin main
if($LASTEXITCODE -ne 0){exit 2}
npm run check
if($LASTEXITCODE -ne 0){exit 3}
Write-Output 'Source synchronized. Customer records stay in private Supabase.'
