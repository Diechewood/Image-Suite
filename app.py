import os
from flask import Flask, request, send_file, render_template, make_response, send_from_directory
from rembg import remove
from PIL import Image, ImageFilter
from io import BytesIO

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/background-remover', methods=['POST'])
def background_remover():
    return process_image(request, remove_background)

@app.route('/blur-image', methods=['POST'])
def blur_image():
    blur_percentage = int(request.form.get('blur_percentage', 50))
    return process_image(request, lambda img: apply_blur(img, blur_percentage))

@app.route('/image-rescaler', methods=['POST'])
def image_rescaler():
    scale_percentage = int(request.form.get('scale_percentage', 100))
    return process_image(request, lambda img: rescale_image(img, scale_percentage))

@app.route('/bokeh-effect', methods=['POST'])
def bokeh_effect():
    bokeh_blur = int(request.form.get('bokeh_blur', 50))
    return process_image(request, lambda img: apply_bokeh_effect(img, bokeh_blur))

def process_image(request, process_function):
    if 'file' not in request.files:
        return 'No file uploaded', 400
    file = request.files['file']
    if file.filename == '':
        return 'No file selected', 400
    if file:
        input_image = Image.open(file.stream)
        output_image = process_function(input_image)
        img_io = BytesIO()
        output_image.save(img_io, 'PNG')
        img_io.seek(0)

        response = make_response(send_file(img_io, mimetype='image/png', as_attachment=True, download_name='processed_image.png'))
        response.headers['Cache-Control'] = 'no-store'
        return response
    return 'Error processing file', 500

def remove_background(input_image):
    return remove(input_image, post_process_mask=True)

def apply_blur(input_image, percentage):
    return input_image.filter(ImageFilter.GaussianBlur(radius=percentage / 10))

def rescale_image(input_image, percentage):
    width = int(input_image.width * (percentage / 100))
    height = int(input_image.height * (percentage / 100))
    return input_image.resize((width, height), Image.LANCZOS)

def apply_bokeh_effect(input_image, blur_intensity):
    mask = remove(input_image, only_mask=True)
    blurred_image = input_image.filter(ImageFilter.GaussianBlur(radius=blur_intensity / 10))
    output_image = Image.composite(input_image, blurred_image, mask)
    return output_image

@app.route('/html/<path:filename>')
def html_files(filename):
    return send_from_directory('html', filename)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=True)
