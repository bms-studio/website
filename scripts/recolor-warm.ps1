# Warm-shift: ivory/sage core + light-mode composition polish
$ErrorActionPreference = 'Stop'
$file = Join-Path $PSScriptRoot '..\public\index.html'
$c = Get-Content -Raw -Encoding UTF8 $file

$map = @(
  @('rgba(233,233,235','rgba(230,227,220'),
  @('rgba(213,213,218','rgba(206,209,199'),
  @('rgba(170,180,191','rgba(150,172,159'),
  @('#e9e9eb','#e6e3dc'), @('#E9E9EB','#e6e3dc'),
  @('#c6c6cc','#c6c0b2'), @('#C6C6CC','#c6c0b2'),
  @('#d5d5d9','#d8d4ca'), @('#D5D5D9','#d8d4ca'),
  @('#9aa3ad','#93ab9e'), @('#9AA3AD','#93ab9e'),
  @('#aab4bf','#a3b3a7'), @('#AAB4BF','#a3b3a7'),
  @('0xe9e9eb','0xe6e3dc'),
  @('0x9aa3ad','0x93ab9e')
)
foreach ($pair in $map) { $c = $c.Replace($pair[0], $pair[1]) }

# Light mode: sekunder jadi sage gelap agar selaras palet baru
$c = $c.Replace('--secondary: #75808c;', '--secondary: #6e8a7c;')

Set-Content -Path $file -Value $c -Encoding UTF8 -NoNewline

# Favicon ikut palet ivory->sage
$fav = Join-Path $PSScriptRoot '..\public\favicon.svg'
$f = Get-Content -Raw -Encoding UTF8 $fav
$f = $f.Replace('#e9e9eb', '#e6e3dc').Replace('#9aa3ad', '#93ab9e')
Set-Content -Path $fav -Value $f -Encoding UTF8 -NoNewline

# Seed & template backend
foreach ($rel in @('..\database\db.js', '..\routes\email.js')) {
  $p = Join-Path $PSScriptRoot $rel
  $b = Get-Content -Raw -Encoding UTF8 $p
  $b = $b.Replace('#e9e9eb', '#e6e3dc').Replace('#9aa3ad', '#93ab9e').Replace('#67e8f9', '#93ab9e')
  Set-Content -Path $p -Value $b -Encoding UTF8 -NoNewline
}

# Medals: emas neon -> champagne muted
foreach ($m in (Get-ChildItem (Join-Path $PSScriptRoot '..\public') -Filter 'medal-*.svg')) {
  $mc = Get-Content -Raw -Encoding UTF8 $m.FullName
  $mc = $mc.Replace('#FFD700', '#C9AD72').Replace('#FFA500', '#C9AD72').Replace('#DAA520', '#B39868').Replace('#E5A852', '#B39868')
  Set-Content -Path $m.FullName -Value $mc -Encoding UTF8 -NoNewline
}
"warm-shift applied"
