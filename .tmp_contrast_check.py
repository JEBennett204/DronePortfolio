from math import pow

def hex_to_rgb(hexstr):
    h = hexstr.lstrip('#')
    if len(h)==8: h=h[:6]
    return tuple(int(h[i:i+2],16) for i in (0,2,4))

def srgb_to_linear(c):
    c = c/255.0
    if c <= 0.03928:
        return c/12.92
    return pow((c+0.055)/1.055, 2.4)

def luminance(rgb):
    r,g,b = rgb
    R = srgb_to_linear(r)
    G = srgb_to_linear(g)
    B = srgb_to_linear(b)
    return 0.2126*R + 0.7152*G + 0.0722*B

def contrast(hex1, hex2):
    L1 = luminance(hex_to_rgb(hex1))
    L2 = luminance(hex_to_rgb(hex2))
    lighter = max(L1,L2)
    darker = min(L1,L2)
    return (lighter+0.05)/(darker+0.05)

palette = {
    'rust-brown':'#8f4013',
    'dark-khaki':'#323a17',
    'lilac-ash':'#a4a0ae',
    'deep-walnut':'#553915',
    'olive':'#716a25',
    'background-light':'#f5f5f7',
    'text-light':'#ffffff',
    'text-dark':'#1c1c1e'
}

pairs = [
    ('rust-brown','background-light'),
    ('deep-walnut','background-light'),
    ('lilac-ash','background-light'),
    ('olive','background-light'),
    ('rust-brown','text-light'),
    ('deep-walnut','text-light'),
    ('text-dark','background-light')
]

for a,b in pairs:
    c = contrast(palette[a], palette[b])
    print(f"{a} ({palette[a]}) vs {b} ({palette[b]}) => {c:.2f}")
