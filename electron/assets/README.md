# electron/assets/

## Icon Files

Place your app icons here. The `main.js` and `builder.yml` already point to these exact paths.

| File              | Format    | Use                          | Minimum Size |
|-------------------|-----------|------------------------------|--------------|
| `icon.ico`        | ICO       | Windows app icon & installer | 256×256      |
| `icon.icns`       | ICNS      | macOS app icon               | 512×512      |
| `icon.png`        | PNG       | Linux app icon               | 256×256      |

### Quick ICO → ICNS conversion (macOS terminal)
```bash
# Requires ImageMagick: brew install imagemagick
convert icon.ico icon.icns
```

### Quick ICO → PNG extraction
```bash
convert icon.ico[3] icon.png   # [3] = 256×256 frame, adjust index if needed
```

You can create an `.ico` file from any PNG at:  
https://www.icoconverter.com  or  https://cloudconvert.com/png-to-ico
