
import re

# Read the HTML content
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the SVG icon link (specifically href="data:image/svg+xml,...")
match = re.search(r'link rel="icon" type="image/svg\+xml" href="data:image/svg\+xml,([^"]+)"', content)
if match:
    svg_data = match.group(1).replace('%3C', '<').replace('%3E', '>').replace('%23', '#').replace('%27', "'")
    
    # Save as separate icon files
    with open('icon.svg', 'w', encoding='utf-8') as f_out:
        f_out.write(svg_data)
        
    print(f"Extracted icon.svg: {len(svg_data)} chars.")
else:
    print("Could not find SVG icon in index.html")
