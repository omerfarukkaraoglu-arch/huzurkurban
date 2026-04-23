from PIL import Image

def make_transparent(img_path):
    img = Image.open(img_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    # Determine the threshold for "white"
    for item in datas:
        # If the pixel is very white, make it transparent
        if item[0] > 220 and item[1] > 220 and item[2] > 220:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(img_path, "PNG")
    print(f"Processed {img_path}")

make_transparent("c:/Users/Ömer/Desktop/Projeler/HuzurKurban/public/logo-icon.png")
make_transparent("c:/Users/Ömer/Desktop/Projeler/HuzurKurban/public/logo.png")
