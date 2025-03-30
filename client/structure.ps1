# Define the folder structure
$folders = @(
    "public/assets/images",
    "src/app/funds",
    "src/app/settings",
    "src/app/reports",
    "src/app",
    "src/components/ui",
    "src/components/cards",
    "src/lib",
    "src/hooks",
    "src/types",
    "src/store"
)

# Define the files to be created
$files = @(
    "src/app/page.tsx",
    "src/app/layout.tsx",
    "src/app/funds/page.tsx",
    "src/app/settings/page.tsx",
    "src/app/reports/page.tsx",
    "src/components/navbar.tsx",
    "src/components/sidebar.tsx",
    "src/components/cards/recent-match-card.tsx",
    "src/components/cards/quick-stats-card.tsx",
    "src/components/cards/join-match-card.tsx",
    "src/components/cards/believe-game-card.tsx",
    "src/lib/supabase.ts",
    "src/lib/utils.ts",
    "src/hooks/use-store.ts",
    "src/types/index.ts",
    "src/store/index.ts"
)

# Create the folders if they don't exist
foreach ($folder in $folders) {
    if (!(Test-Path -Path $folder)) {
        New-Item -Path $folder -ItemType Directory -Force
        Write-Host "Created folder: $folder"
    } else {
        Write-Host "Folder exists: $folder"
    }
}

# Create the files if they don't exist
foreach ($file in $files) {
    if (!(Test-Path -Path $file)) {
        New-Item -Path $file -ItemType File -Force
        Write-Host "Created file: $file"
    } else {
        Write-Host "File exists: $file"
    }
}

Write-Host "Project structure setup complete!"
