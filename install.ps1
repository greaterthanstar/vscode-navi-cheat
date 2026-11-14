$ErrorActionPreference = "Stop"
$sourceDir = $PSScriptRoot
$vsixPath = Join-Path $sourceDir "navi-cheat-syntax-1.0.1.vsix"
$stageDir = Join-Path $sourceDir ".vsix-stage"

Get-ChildItem -Path $sourceDir -Filter "*.vsix" | Remove-Item -Force
if (Test-Path $stageDir) { Remove-Item -Recurse -Force $stageDir }

New-Item -ItemType Directory -Path "$stageDir\extension\syntaxes" -Force | Out-Null

Copy-Item "$sourceDir\package.json" "$stageDir\extension\package.json"
Copy-Item "$sourceDir\language-configuration.json" "$stageDir\extension\language-configuration.json"
Copy-Item "$sourceDir\README.md" "$stageDir\extension\README.md"
Copy-Item "$sourceDir\LICENSE" "$stageDir\extension\LICENSE"
Copy-Item "$sourceDir\syntaxes\navi-cheat.tmLanguage.json" "$stageDir\extension\syntaxes\navi-cheat.tmLanguage.json"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$contentTypes = @'
<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension=".json" ContentType="application/json" />
  <Default Extension=".md" ContentType="text/markdown" />
  <Default Extension=".vsixmanifest" ContentType="text/xml" />
</Types>
'@
[System.IO.File]::WriteAllText("$stageDir\[Content_Types].xml", $contentTypes, $utf8NoBom)

$manifest = @'
<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011">
  <Metadata>
    <Identity Language="en-US" Id="navi-cheat-syntax" Version="1.0.1" Publisher="greaterthanstar" />
    <DisplayName>Navi Cheat Sheet Syntax</DisplayName>
    <Description xml:space="preserve">Syntax highlighting for navi .cheat files</Description>
    <Tags>navi,cheat,cheatsheet,syntax,highlighting</Tags>
    <Categories>Programming Languages</Categories>
    <GalleryFlags>Public</GalleryFlags>
    <Properties>
      <Property Id="Microsoft.VisualStudio.Code.Engine" Value="^1.60.0" />
      <Property Id="Microsoft.VisualStudio.Code.ExtensionDependencies" Value="" />
      <Property Id="Microsoft.VisualStudio.Code.ExtensionPack" Value="" />
      <Property Id="Microsoft.VisualStudio.Code.ExtensionKind" Value="ui,workspace" />
      <Property Id="Microsoft.VisualStudio.Code.LocalizedLanguages" Value="" />
      <Property Id="Microsoft.VisualStudio.Services.Links.Source" Value="https://github.com/greaterthanstar/vscode-navi-cheat.git" />
    </Properties>
    <License>extension/LICENSE</License>
  </Metadata>
  <Installation>
    <InstallationTarget Id="Microsoft.VisualStudio.Code" />
  </Installation>
  <Dependencies />
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true" />
    <Asset Type="Microsoft.VisualStudio.Services.Content.Details" Path="extension/README.md" Addressable="true" />
    <Asset Type="Microsoft.VisualStudio.Services.Content.License" Path="extension/LICENSE" Addressable="true" />
  </Assets>
</PackageManifest>
'@
[System.IO.File]::WriteAllText("$stageDir\extension.vsixmanifest", $manifest, $utf8NoBom)

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::Open($vsixPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    $files = Get-ChildItem -LiteralPath $stageDir -Recurse -File
    foreach ($file in $files) {
        $relPath = $file.FullName.Substring($stageDir.Length + 1).Replace('\', '/')
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $relPath) | Out-Null
    }
} finally {
    $zip.Dispose()
}

Remove-Item -Recurse -Force $stageDir
Write-Host "Built VSIX package: $vsixPath" -ForegroundColor Green
