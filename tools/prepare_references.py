"""Create web-size photo references; never modify the provided originals."""
from pathlib import Path
from PIL import Image, ImageOps

source = Path('/home/ros/Downloads')
target = Path(__file__).resolve().parents[1] / 'public' / 'references'
target.mkdir(parents=True, exist_ok=True)
files = [
    ('image.png', 'bus-side.jpg'), ('image (1).png', 'bus-front.jpg'),
    ('image (2).png', 'bus-roof-1.jpg'), ('image (3).png', 'bus-roof-2.jpg'),
    ('image (4).png', 'bus-roof-3.jpg'),
]
for original, output in files:
    with Image.open(source / original) as image:
        image = ImageOps.contain(ImageOps.exif_transpose(image).convert('RGB'), (1440, 1920))
        image.save(target / output, quality=85, optimize=True)
        print(output, image.size)
