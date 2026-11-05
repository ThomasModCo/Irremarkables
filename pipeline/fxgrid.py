import sys, glob, os
from PIL import Image, ImageDraw, ImageFont
pre, out = sys.argv[1], sys.argv[2]
names = ['hit','kill','pyro','fireball','explosion','cryo','shatter','teleport','invisibility','flight','speed','shapeshift','duplication','slam','landing','switch']
ims = [(n, Image.open(f'{pre}-{n}.png').convert('RGB')) for n in names if os.path.exists(f'{pre}-{n}.png')]
w, h = 400, 250; cols = 4
c = Image.new('RGB', (w * cols, h * ((len(ims) + cols - 1) // cols)), 'white')
d = ImageDraw.Draw(c)
for i, (n, im) in enumerate(ims):
    x, y = (i % cols) * w, (i // cols) * h
    c.paste(im.resize((w, h)), (x, y)); d.rectangle([x, y, x + 110, y + 20], fill='black'); d.text((x + 5, y + 4), n, fill='white')
c.save(out, quality=85)
