$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$projectPath = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$repoPath = (Resolve-Path (Join-Path $projectPath '..')).Path
$destination = (Resolve-Path (Join-Path $repoPath '..')).Path
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$packages = @(
    @{ Name='ystu-frontend-9.zip'; Prefix='ystu-frontend-9/'; Source=$repoPath; Items=@('css','fonts','images','js','pages','project-ystu-frontend','README.md','THIRD-PARTY-NOTICES.md','.nojekyll') },
    @{ Name='ystu-frontend-handoff-9.zip'; Prefix='ystu-frontend/'; Source=$projectPath; Items=@('src','dist','scripts','.gitignore','package.json','package-lock.json','README.md','INTEGRATION.md','THIRD-PARTY-NOTICES.md','TESTING-CHECKLIST.md','HANDOFF.md','AUDIT-RESPONSE-2026-10-08.md','V9-RECHECK-REPORT-2026-10-08.md') }
)
$hashes = @()
foreach ($package in $packages) {
    $target = Join-Path $destination $package.Name
    $temporary = $target + '.partial-' + $stamp
    $zip = [IO.Compression.ZipFile]::Open($temporary, [IO.Compression.ZipArchiveMode]::Create)
    $included = @{}
    try {
        foreach ($item in $package.Items) {
            $itemPath = Join-Path $package.Source $item
            $files = if (Test-Path -LiteralPath $itemPath -PathType Container) {
                Get-ChildItem -LiteralPath $itemPath -File -Recurse -Force
            } else { Get-Item -LiteralPath $itemPath }
            foreach ($file in $files) {
                $relative = $file.FullName.Substring($package.Source.Length + 1).Replace('\','/')
                if ($relative -match '(^|/)(node_modules|\.git|\.codex|\.vscode|docs|test-results[^/]*)(/|$)') { continue }
                $entryName = $package.Prefix + $relative
                [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $entryName, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
                $included[$entryName] = $file.FullName
            }
        }
    } finally { $zip.Dispose() }
    # Проверяем каждый упакованный файл относительно текущего комплекта.
    $check = [IO.Compression.ZipFile]::OpenRead($temporary)
    try {
        if ($check.Entries.Count -ne $included.Count) { throw 'Archive file count mismatch' }
        foreach ($entry in $check.Entries) {
            $sha = [Security.Cryptography.SHA256]::Create()
            $stream = $entry.Open()
            try { $actual = [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','') }
            finally { $stream.Dispose(); $sha.Dispose() }
            $expected = (Get-FileHash -LiteralPath $included[$entry.FullName] -Algorithm SHA256).Hash
            if ($actual -ne $expected) { throw ('Archive content mismatch: ' + $entry.FullName) }
        }
    } finally { $check.Dispose() }
    if (Test-Path -LiteralPath $target) {
        $backup = $target.Substring(0,$target.Length - 4) + '-before-recheck-' + $stamp + '.zip'
        Move-Item -LiteralPath $target -Destination $backup
        Write-Output ('Previous archive saved: ' + $backup)
    }
    Move-Item -LiteralPath $temporary -Destination $target
    $hash = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
    $hashes += ($hash + '  ' + $package.Name)
    Write-Output ($package.Name + ': ' + $included.Count + ' verified files; ' + (Get-Item -LiteralPath $target).Length + ' bytes')
}
$checksumPath = Join-Path $destination 'ystu-frontend-9-SHA256.txt'
[IO.File]::WriteAllText($checksumPath, ($hashes -join "`r`n") + "`r`n", [Text.UTF8Encoding]::new($false))
Write-Output ('Checksums: ' + $checksumPath)
