param(
    [string]$OutputDir = "docs/enemy-marker-previews"
)

Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$out = Join-Path $root $OutputDir
New-Item -ItemType Directory -Force -Path $out | Out-Null

function Color-Hex([string]$hex, [int]$alpha = 255) {
    $h = $hex.TrimStart("#")
    $r = [Convert]::ToInt32($h.Substring(0, 2), 16)
    $g = [Convert]::ToInt32($h.Substring(2, 2), 16)
    $b = [Convert]::ToInt32($h.Substring(4, 2), 16)
    return [System.Drawing.Color]::FromArgb($alpha, $r, $g, $b)
}

function New-Brush([string]$hex, [int]$alpha = 255) {
    return [System.Drawing.SolidBrush]::new((Color-Hex $hex $alpha))
}

function New-Pen([string]$hex, [float]$width = 2, [int]$alpha = 255) {
    $pen = [System.Drawing.Pen]::new((Color-Hex $hex $alpha), $width)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    return $pen
}

function Points-Polygon([float]$cx, [float]$cy, [float]$radius, [int]$sides, [float]$rotationDeg = -90) {
    $points = @()
    for ($i = 0; $i -lt $sides; $i++) {
        $angle = (($rotationDeg + (360 * $i / $sides)) * [Math]::PI) / 180
        $points += [System.Drawing.PointF]::new(
            [float]($cx + [Math]::Cos($angle) * $radius),
            [float]($cy + [Math]::Sin($angle) * $radius)
        )
    }
    return $points
}

function Fill-Polygon($g, [string]$hex, [float]$cx, [float]$cy, [float]$radius, [int]$sides, [float]$rotationDeg = -90, [int]$alpha = 255) {
    $shadow = New-Brush "#05070B" ([Math]::Min(230, $alpha))
    $g.TranslateTransform(4, 5)
    $g.FillPolygon($shadow, (Points-Polygon $cx $cy $radius $sides $rotationDeg))
    $g.TranslateTransform(-4, -5)
    $shadow.Dispose()
    $brush = New-Brush $hex $alpha
    $g.FillPolygon($brush, (Points-Polygon $cx $cy $radius $sides $rotationDeg))
    $brush.Dispose()
}

function Stroke-Polygon($g, [string]$hex, [float]$cx, [float]$cy, [float]$radius, [int]$sides, [float]$rotationDeg = -90, [float]$width = 2, [int]$alpha = 255) {
    $pen = New-Pen $hex $width $alpha
    $g.DrawPolygon($pen, (Points-Polygon $cx $cy $radius $sides $rotationDeg))
    $pen.Dispose()
}

function Fill-Circle($g, [string]$hex, [float]$cx, [float]$cy, [float]$radius, [int]$alpha = 255) {
    $shadow = New-Brush "#05070B" ([Math]::Min(230, $alpha))
    $g.FillEllipse($shadow, $cx - $radius + 4, $cy - $radius + 5, $radius * 2, $radius * 2)
    $shadow.Dispose()
    $brush = New-Brush $hex $alpha
    $g.FillEllipse($brush, $cx - $radius, $cy - $radius, $radius * 2, $radius * 2)
    $brush.Dispose()
}

function Stroke-Circle($g, [string]$hex, [float]$cx, [float]$cy, [float]$radius, [float]$width = 2, [int]$alpha = 255) {
    $pen = New-Pen $hex $width $alpha
    $g.DrawEllipse($pen, $cx - $radius, $cy - $radius, $radius * 2, $radius * 2)
    $pen.Dispose()
}

function Fill-Square($g, [string]$hex, [float]$cx, [float]$cy, [float]$size, [float]$rotationDeg = 0, [int]$alpha = 255) {
    $state = $g.Save()
    $g.TranslateTransform($cx, $cy)
    $g.RotateTransform($rotationDeg)
    $shadow = New-Brush "#05070B" ([Math]::Min(230, $alpha))
    $g.FillRectangle($shadow, -$size / 2 + 4, -$size / 2 + 5, $size, $size)
    $shadow.Dispose()
    $brush = New-Brush $hex $alpha
    $g.FillRectangle($brush, -$size / 2, -$size / 2, $size, $size)
    $brush.Dispose()
    $g.Restore($state)
}

function Stroke-Square($g, [string]$hex, [float]$cx, [float]$cy, [float]$size, [float]$rotationDeg = 0, [float]$width = 2, [int]$alpha = 255) {
    $state = $g.Save()
    $g.TranslateTransform($cx, $cy)
    $g.RotateTransform($rotationDeg)
    $pen = New-Pen $hex $width $alpha
    $g.DrawRectangle($pen, -$size / 2, -$size / 2, $size, $size)
    $pen.Dispose()
    $g.Restore($state)
}

function Draw-Line($g, [string]$hex, [float]$x1, [float]$y1, [float]$x2, [float]$y2, [float]$width = 2, [int]$alpha = 255) {
    $pen = New-Pen $hex $width $alpha
    $g.DrawLine($pen, $x1, $y1, $x2, $y2)
    $pen.Dispose()
}

function Draw-Arc($g, [string]$hex, [float]$cx, [float]$cy, [float]$r, [float]$start, [float]$sweep, [float]$width = 2, [int]$alpha = 255) {
    $pen = New-Pen $hex $width $alpha
    $g.DrawArc($pen, $cx - $r, $cy - $r, $r * 2, $r * 2, $start, $sweep)
    $pen.Dispose()
}

function Draw-Text($g, [string]$text, [float]$x, [float]$y, [float]$size = 11, [string]$hex = "#E5E7EB") {
    $font = [System.Drawing.Font]::new("Arial", $size, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    $brush = New-Brush $hex
    $format = [System.Drawing.StringFormat]::new()
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString($text, $font, $brush, $x, $y, $format)
    $format.Dispose()
    $brush.Dispose()
    $font.Dispose()
}

function Draw-Flat-Polygon($g, [string]$hex, [array]$points, [float]$width = 2, [int]$alpha = 255, [bool]$fill = $false) {
    if ($fill) {
        $brush = New-Brush $hex $alpha
        $g.FillPolygon($brush, $points)
        $brush.Dispose()
        return
    }
    $pen = New-Pen $hex $width $alpha
    $g.DrawPolygon($pen, $points)
    $pen.Dispose()
}

function Draw-Rarity-Pedestal($g, [hashtable]$m, [float]$cx, [float]$cy, [float]$r, [float]$scale = 1.0) {
    $tier = [string]$m.Tier
    $shape = "shadow"
    $color = "#D9DDE1"
    $alpha = 40
    $radiusScale = 0.72
    $lineWidth = 1.0
    $pulse = $false

    switch ($tier) {
        "magic" {
            $shape = "diamond"
            $color = "#4AA3FF"
            $alpha = 210
            $radiusScale = 0.82
            $lineWidth = 2.0
        }
        "rare" {
            $shape = "hexagon"
            $color = "#F5C542"
            $alpha = 224
            $radiusScale = 0.95
            $lineWidth = 2.5
        }
        "boss" {
            $shape = "hexagon"
            $color = "#FF4D3D"
            $alpha = 235
            $radiusScale = 1.15
            $lineWidth = 3.0
            $pulse = $true
        }
    }

    $w = $r * $radiusScale * $scale
    $h = $w * 0.34
    $py = $cy + $r * 1.0

    if ($shape -eq "shadow") {
        $brush = New-Brush $color $alpha
        $g.FillEllipse($brush, $cx - $w, $py - $h, $w * 2, $h * 2)
        $brush.Dispose()
        return
    }

    if ($shape -eq "diamond") {
        $points = @(
            [System.Drawing.PointF]::new($cx, $py - $h),
            [System.Drawing.PointF]::new($cx + $w, $py),
            [System.Drawing.PointF]::new($cx, $py + $h),
            [System.Drawing.PointF]::new($cx - $w, $py)
        )
        Draw-Flat-Polygon $g $color $points ($lineWidth * $scale) $alpha $false
        return
    }

    if ($pulse) {
        $outerW = $w * 1.18
        $outerH = $h * 1.18
        $outer = @(
            [System.Drawing.PointF]::new($cx - $outerW, $py),
            [System.Drawing.PointF]::new($cx - $outerW * 0.5, $py - $outerH),
            [System.Drawing.PointF]::new($cx + $outerW * 0.5, $py - $outerH),
            [System.Drawing.PointF]::new($cx + $outerW, $py),
            [System.Drawing.PointF]::new($cx + $outerW * 0.5, $py + $outerH),
            [System.Drawing.PointF]::new($cx - $outerW * 0.5, $py + $outerH)
        )
        Draw-Flat-Polygon $g $color $outer (1.4 * $scale) 70 $false
    }

    $points = @(
        [System.Drawing.PointF]::new($cx - $w, $py),
        [System.Drawing.PointF]::new($cx - $w * 0.5, $py - $h),
        [System.Drawing.PointF]::new($cx + $w * 0.5, $py - $h),
        [System.Drawing.PointF]::new($cx + $w, $py),
        [System.Drawing.PointF]::new($cx + $w * 0.5, $py + $h),
        [System.Drawing.PointF]::new($cx - $w * 0.5, $py + $h)
    )
    Draw-Flat-Polygon $g $color $points ($lineWidth * $scale) $alpha $false
}

function Draw-Marker($g, [hashtable]$m, [float]$cx, [float]$cy, [float]$scale = 1.0) {
    $r = [float]$m.Size * $scale
    $main = $m.Main
    $accent = "#05070B"
    $dark = $m.Dark
    $kind = $m.Shape

    Draw-Rarity-Pedestal $g $m $cx $cy $r $scale
    Stroke-Circle $g "#111827" $cx $cy ($r + 8) 1 180

    switch ($kind) {
        "circle-ring" {
            Fill-Circle $g $main $cx $cy $r
            Stroke-Circle $g $accent $cx $cy ($r + 4) (2.2 * $scale)
        }
        "triangle" {
            Fill-Polygon $g $main $cx $cy $r 3 -90
            Stroke-Polygon $g $accent $cx $cy $r 3 -90 (2 * $scale)
        }
        "square-dot" {
            Fill-Square $g $main $cx $cy ($r * 1.55) 0
            Fill-Circle $g $accent $cx $cy ($r * .18)
        }
        "diamond-tail" {
            Fill-Square $g $main $cx $cy ($r * 1.45) 45
            Draw-Line $g $accent $cx ($cy + $r * .72) $cx ($cy + $r * 1.25) (2.2 * $scale)
        }
        "double-triangle" {
            Fill-Polygon $g $main ($cx - $r * .28) $cy ($r * .78) 3 -90
            Fill-Polygon $g $accent ($cx + $r * .28) $cy ($r * .78) 3 -90 210
        }
        "hex-eye" {
            Fill-Polygon $g $main $cx $cy $r 6 -90
            Draw-Line $g $accent ($cx - $r * .48) $cy ($cx + $r * .48) $cy (2.3 * $scale)
        }
        "cluster" {
            Fill-Circle $g $main ($cx - $r * .42) ($cy + $r * .22) ($r * .42)
            Fill-Circle $g $main ($cx + $r * .42) ($cy + $r * .22) ($r * .42)
            Fill-Circle $g $accent $cx ($cy - $r * .38) ($r * .42)
            Draw-Line $g $accent ($cx - $r * .18) ($cy + $r * .08) ($cx + $r * .18) ($cy + $r * .08) (1.5 * $scale) 160
        }
        "needle-ghost" {
            Fill-Polygon $g $accent ($cx - $r * .32) ($cy + $r * .2) ($r * .85) 3 -90 70
            Fill-Polygon $g $main ($cx + $r * .12) $cy $r 3 -90
        }
        "circle-square" {
            Stroke-Circle $g $main $cx $cy $r (3 * $scale)
            Fill-Square $g $accent $cx $cy ($r * 1.0) 0
        }
        "tri-in-tri" {
            Fill-Polygon $g $main $cx $cy $r 3 -90
            Fill-Polygon $g $accent $cx ($cy + $r * .1) ($r * .45) 3 90
        }
        "crystal-cross" {
            Fill-Square $g $main $cx $cy ($r * 1.55) 45
            Draw-Line $g $accent $cx ($cy - $r * .72) $cx ($cy + $r * .72) (2 * $scale)
            Draw-Line $g $accent ($cx - $r * .72) $cy ($cx + $r * .72) $cy (2 * $scale)
        }
        "hex-core" {
            Stroke-Polygon $g $main $cx $cy $r 6 -90 (3 * $scale)
            Fill-Circle $g $accent $cx $cy ($r * .42)
        }
        "broken-ring-bolt" {
            Fill-Circle $g $main ($cx - $r * .16) $cy ($r * .72)
            Fill-Circle $g "#05070B" ($cx + $r * .14) ($cy - $r * .06) ($r * .42)
            $pts = @(
                [System.Drawing.PointF]::new($cx - $r * .18, $cy - $r * .55),
                [System.Drawing.PointF]::new($cx + $r * .08, $cy - $r * .05),
                [System.Drawing.PointF]::new($cx - $r * .08, $cy - $r * .05),
                [System.Drawing.PointF]::new($cx + $r * .2, $cy + $r * .55)
            )
            $pen = New-Pen $accent (2.4 * $scale)
            $g.DrawLines($pen, $pts)
            $pen.Dispose()
        }
        "square-invtri" {
            Stroke-Square $g $main $cx $cy ($r * 1.55) 0 (3 * $scale)
            Fill-Polygon $g $accent $cx ($cy + $r * .08) ($r * .45) 3 90
        }
        "wind-wheel" {
            for ($i = 0; $i -lt 3; $i++) {
                Fill-Polygon $g $main ($cx + [Math]::Cos(($i * 120 - 90) * [Math]::PI / 180) * $r * .36) ($cy + [Math]::Sin(($i * 120 - 90) * [Math]::PI / 180) * $r * .36) ($r * .46) 3 ($i * 120 - 70) 220
            }
            Fill-Circle $g $accent $cx $cy ($r * .18)
        }
        "double-diamond" {
            Stroke-Square $g $main $cx $cy ($r * 1.65) 45 (3 * $scale)
            Stroke-Square $g $accent $cx $cy ($r * .82) 45 (2 * $scale)
        }
        "tri-crown" {
            Fill-Polygon $g $main ($cx - $r * .48) ($cy + $r * .12) ($r * .54) 3 -88
            Fill-Polygon $g $accent $cx ($cy - $r * .08) ($r * .66) 3 -90
            Fill-Polygon $g $main ($cx + $r * .48) ($cy + $r * .12) ($r * .54) 3 -92
        }
        "ring-square-corners" {
            Stroke-Circle $g $main $cx $cy $r (3.2 * $scale)
            Fill-Square $g $accent $cx $cy ($r * .92) 0
            foreach ($a in 45,135,225,315) {
                $x1 = $cx + [Math]::Cos($a * [Math]::PI / 180) * $r * .96
                $y1 = $cy + [Math]::Sin($a * [Math]::PI / 180) * $r * .96
                $x2 = $cx + [Math]::Cos($a * [Math]::PI / 180) * $r * 1.22
                $y2 = $cy + [Math]::Sin($a * [Math]::PI / 180) * $r * 1.22
                Draw-Line $g $accent $x1 $y1 $x2 $y2 (2 * $scale)
            }
        }
        "star-diamonds" {
            Fill-Square $g $accent $cx $cy ($r * .65) 45
            foreach ($a in 0,72,144,216,288) {
                Fill-Square $g $main ($cx + [Math]::Cos($a * [Math]::PI / 180) * $r * .78) ($cy + [Math]::Sin($a * [Math]::PI / 180) * $r * .78) ($r * .45) 45
            }
        }
        "hex-tri-layers" {
            Stroke-Polygon $g $main $cx $cy $r 6 -90 (3 * $scale)
            Fill-Polygon $g $main $cx $cy ($r * .72) 3 -90 190
            Fill-Polygon $g $accent $cx $cy ($r * .43) 3 90
        }
        "square-spikes" {
            Fill-Square $g $main $cx $cy ($r * 1.25) 0
            foreach ($a in 0,90,180,270) {
                Fill-Polygon $g $accent ($cx + [Math]::Cos($a * [Math]::PI / 180) * $r * .86) ($cy + [Math]::Sin($a * [Math]::PI / 180) * $r * .86) ($r * .26) 3 $a
            }
        }
        "double-ring-eye" {
            Stroke-Circle $g $main $cx $cy $r (2.4 * $scale)
            Stroke-Circle $g $main $cx $cy ($r * .7) (2.2 * $scale) 180
            Draw-Line $g $accent $cx ($cy - $r * .46) $cx ($cy + $r * .46) (3 * $scale)
        }
        "obelisk" {
            Fill-Polygon $g $main $cx $cy $r 6 -90
            Fill-Polygon $g $accent $cx ($cy + $r * .75) ($r * .32) 3 90
            Fill-Circle $g "#F4F4F5" $cx ($cy - $r * .22) ($r * .14)
        }
        "twin-shadow" {
            Fill-Polygon $g $main ($cx - $r * .22) $cy ($r * .78) 3 -90 150
            Fill-Polygon $g $accent ($cx + $r * .22) $cy ($r * .78) 3 90 180
            Fill-Circle $g "#EEF2FF" $cx $cy ($r * .18)
        }
        "boss-king" {
            Stroke-Polygon $g $main $cx $cy $r 6 -90 (4 * $scale)
            Fill-Square $g $accent $cx ($cy + $r * .08) ($r * .72) 0
            Fill-Polygon $g $main $cx ($cy - $r * .68) ($r * .38) 3 -90
        }
        "boss-void" {
            Fill-Circle $g $main ($cx - $r * .18) $cy ($r * .72)
            Fill-Circle $g "#05070B" ($cx + $r * .16) ($cy - $r * .08) ($r * .46)
            Draw-Arc $g $main $cx $cy $r 12 105 (4 * $scale)
            Draw-Arc $g $main $cx $cy ($r * .76) 190 120 (3.2 * $scale)
        }
        "boss-pinwheel" {
            foreach ($a in 0,90,180,270) {
                Fill-Polygon $g $main ($cx + [Math]::Cos($a * [Math]::PI / 180) * $r * .34) ($cy + [Math]::Sin($a * [Math]::PI / 180) * $r * .34) ($r * .56) 3 ($a - 90)
            }
            Fill-Square $g $accent $cx $cy ($r * .52) 45
        }
        "boss-star-mother" {
            Stroke-Circle $g $main $cx $cy $r (3.5 * $scale)
            Fill-Polygon $g $dark $cx $cy ($r * .42) 6 -90
            foreach ($a in 0,45,90,135,180,225,270,315) {
                Fill-Square $g $accent ($cx + [Math]::Cos($a * [Math]::PI / 180) * $r * .86) ($cy + [Math]::Sin($a * [Math]::PI / 180) * $r * .86) ($r * .22) 45
            }
        }
        "boss-judicator" {
            Stroke-Square $g $main $cx $cy ($r * 1.55) 0 (4 * $scale)
            Draw-Line $g $accent $cx ($cy - $r * .62) $cx ($cy + $r * .62) (3.5 * $scale)
            Draw-Line $g $accent ($cx - $r * .62) $cy ($cx + $r * .62) $cy (3.5 * $scale)
            foreach ($sx in -1,1) { foreach ($sy in -1,1) { Fill-Polygon $g $dark ($cx + $sx * $r * .76) ($cy + $sy * $r * .76) ($r * .18) 3 45 } }
        }
        "boss-eclipse" {
            Fill-Circle $g $main $cx $cy $r
            Stroke-Polygon $g $accent $cx $cy ($r * .68) 6 -90 (3 * $scale)
            Fill-Circle $g $dark ($cx + $r * .18) ($cy - $r * .12) ($r * .28)
        }
        "boss-mirror" {
            Stroke-Square $g $main $cx $cy ($r * 1.55) 45 (4 * $scale)
            Stroke-Square $g $accent $cx $cy ($r * 1.0) 45 (2.5 * $scale) 170
            Fill-Square $g "#EEF2FF" $cx $cy ($r * .42) 0
            Stroke-Square $g $accent ($cx + $r * .42) ($cy - $r * .42) ($r * .48) 45 (1.8 * $scale) 90
        }
        "boss-triad" {
            Stroke-Circle $g $accent $cx $cy $r (2.5 * $scale)
            foreach ($a in -90,30,150) {
                Fill-Polygon $g $main ($cx + [Math]::Cos($a * [Math]::PI / 180) * $r * .34) ($cy + [Math]::Sin($a * [Math]::PI / 180) * $r * .34) ($r * .46) 3 ($a + 90)
            }
            Fill-Circle $g "#FFEDD5" $cx $cy ($r * .24)
        }
    }
}

$markers = @(
    @{ Id="N-01"; Tier="normal"; Name="Dust Crawler"; Shape="circle-ring"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=22 },
    @{ Id="N-02"; Tier="normal"; Name="Horn Crawler"; Shape="triangle"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=22 },
    @{ Id="N-03"; Tier="normal"; Name="Stone Shell"; Shape="square-dot"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=22 },
    @{ Id="N-04"; Tier="normal"; Name="Loose Shard"; Shape="diamond-tail"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=22 },
    @{ Id="N-05"; Tier="normal"; Name="Twin Fang"; Shape="double-triangle"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=22 },
    @{ Id="N-06"; Tier="normal"; Name="Dusk Sentry"; Shape="hex-eye"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=22 },
    @{ Id="N-07"; Tier="normal"; Name="Shard Swarm"; Shape="cluster"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=22 },
    @{ Id="N-08"; Tier="normal"; Name="Needle Shade"; Shape="needle-ghost"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=22 },

    @{ Id="M-01"; Tier="magic"; Name="Blue Core Sigil"; Shape="circle-square"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=26 },
    @{ Id="M-02"; Tier="magic"; Name="Flame Fold"; Shape="tri-in-tri"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=26 },
    @{ Id="M-03"; Tier="magic"; Name="Frost Crystal"; Shape="crystal-cross"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=26 },
    @{ Id="M-04"; Tier="magic"; Name="Venom Weaver"; Shape="hex-core"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=26 },
    @{ Id="M-05"; Tier="magic"; Name="Storm Jumper"; Shape="broken-ring-bolt"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=26 },
    @{ Id="M-06"; Tier="magic"; Name="Blood Sigil"; Shape="square-invtri"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=26 },
    @{ Id="M-07"; Tier="magic"; Name="Wind Wheel"; Shape="wind-wheel"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=26 },
    @{ Id="M-08"; Tier="magic"; Name="Mirror Caster"; Shape="double-diamond"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=26 },

    @{ Id="E-01"; Tier="rare"; Name="Tri Crown"; Shape="tri-crown"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=32 },
    @{ Id="E-02"; Tier="rare"; Name="Core Warden"; Shape="ring-square-corners"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=32 },
    @{ Id="E-03"; Tier="rare"; Name="Star Hunter"; Shape="star-diamonds"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=32 },
    @{ Id="E-04"; Tier="rare"; Name="Plague Prism"; Shape="hex-tri-layers"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=32 },
    @{ Id="E-05"; Tier="rare"; Name="Red Obsidian"; Shape="square-spikes"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=32 },
    @{ Id="E-06"; Tier="rare"; Name="Phase Judge"; Shape="double-ring-eye"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=32 },
    @{ Id="E-07"; Tier="rare"; Name="Obelisk Walker"; Shape="obelisk"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=32 },
    @{ Id="E-08"; Tier="rare"; Name="Twin Shadow"; Shape="twin-shadow"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=32 },

    @{ Id="B-01"; Tier="boss"; Name="Geometry King"; Shape="boss-king"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#713F12"; Size=52 },
    @{ Id="B-02"; Tier="boss"; Name="Phase Void"; Shape="boss-void"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#020617"; Size=52 },
    @{ Id="B-03"; Tier="boss"; Name="Red Tyrant"; Shape="boss-pinwheel"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=52 },
    @{ Id="B-04"; Tier="boss"; Name="Star Mother"; Shape="boss-star-mother"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#581C87"; Size=52 },
    @{ Id="B-05"; Tier="boss"; Name="Iron Judicator"; Shape="boss-judicator"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#475569"; Size=52 },
    @{ Id="B-06"; Tier="boss"; Name="Toxic Eclipse"; Shape="boss-eclipse"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#1A2E05"; Size=52 },
    @{ Id="B-07"; Tier="boss"; Name="Mirror Regent"; Shape="boss-mirror"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=52 },
    @{ Id="B-08"; Tier="boss"; Name="Final Flame Triad"; Shape="boss-triad"; Main="#F7F7F2"; Accent="#D9DDE1"; Dark="#111827"; Size=52 }
)

function New-Canvas([int]$w, [int]$h) {
    $bmp = [System.Drawing.Bitmap]::new($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $bg = New-Brush "#05070B"
    $g.FillRectangle($bg, 0, 0, $w, $h)
    $bg.Dispose()
    return @{ Bitmap=$bmp; Graphics=$g }
}

foreach ($m in $markers) {
    $canvas = New-Canvas 192 192
    $g = $canvas.Graphics
    Draw-Marker $g $m 96 72 1.0
    Draw-Text $g $m.Id 96 144 13 "#E5E7EB"
    Draw-Text $g $m.Name 96 160 11 "#9CA3AF"
    $path = Join-Path $out ("{0}_{1}.png" -f $m.Id.ToLower(), ($m.Name.ToLower().Replace(" ", "-")))
    $canvas.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $canvas.Bitmap.Dispose()
}

function New-ContactSheet([string]$fileName, [array]$items, [string]$title) {
    $cols = 4
    $cellW = 210
    $cellH = 210
    $top = 54
    $rows = [Math]::Ceiling($items.Count / $cols)
    $canvas = New-Canvas ($cols * $cellW) ($top + $rows * $cellH)
    $g = $canvas.Graphics
    Draw-Text $g $title (($cols * $cellW) / 2) 18 20 "#F8FAFC"
    for ($i = 0; $i -lt $items.Count; $i++) {
        $m = $items[$i]
        $col = $i % $cols
        $row = [Math]::Floor($i / $cols)
        $x = $col * $cellW
        $y = $top + $row * $cellH
        $panel = New-Brush "#0B1020" 230
        $g.FillRectangle($panel, $x + 10, $y + 10, $cellW - 20, $cellH - 20)
        $panel.Dispose()
        Draw-Marker $g $m ($x + $cellW / 2) ($y + 82) 0.95
        Draw-Text $g $m.Id ($x + $cellW / 2) ($y + 154) 13 "#F8FAFC"
        Draw-Text $g $m.Name ($x + $cellW / 2) ($y + 172) 11 "#CBD5E1"
    }
    $path = Join-Path $out $fileName
    $canvas.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $canvas.Bitmap.Dispose()
}

New-ContactSheet "sheet_all_enemy_markers.png" $markers "Enemy Geometry Marker Preview"
New-ContactSheet "sheet_normal_markers.png" @($markers | Where-Object { $_.Tier -eq "normal" }) "Normal Enemy Markers"
New-ContactSheet "sheet_magic_markers.png" @($markers | Where-Object { $_.Tier -eq "magic" }) "Magic Enemy Markers"
New-ContactSheet "sheet_rare_markers.png" @($markers | Where-Object { $_.Tier -eq "rare" }) "Rare Enemy Markers"
New-ContactSheet "sheet_boss_markers.png" @($markers | Where-Object { $_.Tier -eq "boss" }) "Boss Enemy Markers"

Write-Host "Generated $($markers.Count) individual PNGs and 5 contact sheets in $out"
