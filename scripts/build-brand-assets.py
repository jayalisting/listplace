import os
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np
import base64

src_path = '/Users/nikhilkotian/.gemini/antigravity/brain/5a84e6d0-fb5a-4837-8faf-d1419176e018/.user_uploaded/media_1793596607733_28b95181.jpg'
public_dir = '/Users/nikhilkotian/Desktop/JAYA developers/websites/grolow demo 10/public'

# Load high-res source
img = Image.open(src_path).convert('RGB')
arr = np.array(img, dtype=np.float32)

# High-precision white background matting
diff = 255.0 - np.min(arr, axis=2)
alpha = np.clip((diff - 6.0) / (30.0 - 6.0), 0.0, 1.0)

# Unmultiply white to prevent any white edge fringing
unmultiplied = np.zeros_like(arr)
for c in range(3):
    unmultiplied[:, :, c] = np.clip((arr[:, :, c] - (1.0 - alpha) * 255.0) / np.maximum(alpha, 0.05), 0.0, 255.0)

rgba = np.dstack([unmultiplied.astype(np.uint8), (alpha * 255).astype(np.uint8)])
transparent_img = Image.fromarray(rgba, 'RGBA')

# Crop to tight bounding box
bbox = transparent_img.getbbox()
cropped = transparent_img.crop(bbox)

# 1. Master transparent logo (for headers, sidebars, footers, admin)
pad = 16
logo_w = cropped.width + pad * 2
logo_h = cropped.height + pad * 2
master_logo = Image.new('RGBA', (logo_w, logo_h), (0, 0, 0, 0))
master_logo.paste(cropped, (pad, pad), cropped)
master_logo.save(os.path.join(public_dir, 'logo.png'), 'PNG', optimize=True)

# 2. Square icon (512x512) with safe margins for Android PWA
square_512 = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
target_size = 420
scale = min(target_size / cropped.width, target_size / cropped.height)
nw, nh = int(cropped.width * scale), int(cropped.height * scale)
scaled_512 = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
px = (512 - nw) // 2
py = (512 - nh) // 2
square_512.paste(scaled_512, (px, py), scaled_512)
square_512.save(os.path.join(public_dir, 'icon-512.png'), 'PNG', optimize=True)
square_512.save(os.path.join(public_dir, 'icon.png'), 'PNG', optimize=True)

# 3. Square icon (192x192)
icon_192 = square_512.resize((192, 192), Image.Resampling.LANCZOS)
# Gentle sharpness boost for crispness at 192px
enhancer_192 = ImageEnhance.Sharpness(icon_192)
icon_192_crisp = enhancer_192.enhance(1.2)
icon_192_crisp.save(os.path.join(public_dir, 'icon-192.png'), 'PNG', optimize=True)

# 4. Apple Touch Icon (180x180, iOS requires opaque background)
# Deep royal crimson/wine (#180309) with a subtle radial glow
apple_icon = Image.new('RGBA', (180, 180), (20, 4, 10, 255))
# Subtle gold-tinted inner border
apple_draw = Image.new('RGBA', (180, 180), (0, 0, 0, 0))
apple_target = 144
apple_scale = min(apple_target / cropped.width, apple_target / cropped.height)
anw, anh = int(cropped.width * apple_scale), int(cropped.height * apple_scale)
apple_scaled = cropped.resize((anw, anh), Image.Resampling.LANCZOS)
apx = (180 - anw) // 2
apy = (180 - anh) // 2
apple_icon.paste(apple_scaled, (apx, apy), apple_scaled)
apple_icon.convert('RGB').save(os.path.join(public_dir, 'apple-touch-icon.png'), 'PNG', optimize=True)

# 5. Multi-resolution favicon.ico (16, 32, 48)
def make_crisp_ico_size(size):
    target = int(size * 0.90)
    s = min(target / cropped.width, target / cropped.height)
    w, h = int(cropped.width * s), int(cropped.height * s)
    im = cropped.resize((w, h), Image.Resampling.LANCZOS)
    enh = ImageEnhance.Sharpness(im)
    im = enh.enhance(1.4 if size < 32 else 1.2)
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    canvas.paste(im, ((size - w) // 2, (size - h) // 2), im)
    return canvas

fav_48 = make_crisp_ico_size(48)
fav_32 = make_crisp_ico_size(32)
fav_16 = make_crisp_ico_size(16)
fav_48.save(
    os.path.join(public_dir, 'favicon.ico'),
    format='ICO',
    sizes=[(16, 16), (32, 32), (48, 48)],
    append_images=[fav_32, fav_16]
)

# 6. SVG representation wrapping the 512px icon
with open(os.path.join(public_dir, 'icon-512.png'), 'rb') as f:
    b64_png = base64.b64encode(f.read()).decode('utf-8')

svg_markup = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,{b64_png}" width="512" height="512"/>
</svg>
'''
with open(os.path.join(public_dir, 'icon.svg'), 'w', encoding='utf-8') as f:
    f.write(svg_markup)

print('All branding & icon assets successfully generated from master logo!')

