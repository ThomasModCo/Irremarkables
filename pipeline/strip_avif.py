"""three's GLTFLoader ships an inline AVIF probe image (EXT_texture_avif support test).
Media reviewers reject AVIF; our packs never use it, so blank the probe in the built bundle.
usage: python3 strip_avif.py dist/assets"""
import re, sys, glob
for f in glob.glob(sys.argv[1] + '/*.js'):
    s = open(f).read()
    n = len(re.findall(r'data:image/avif;base64,[A-Za-z0-9+/=]+', s))
    if n:
        s = re.sub(r'data:image/avif;base64,[A-Za-z0-9+/=]+', '', s)
        open(f, 'w').write(s); print(f, 'stripped', n)
