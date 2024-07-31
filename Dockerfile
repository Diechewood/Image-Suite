# Use the official Python image from the Docker Hub
FROM python:3.9-slim

# Copy the u2net.onnx model file to avoid unnecessary download
COPY u2net.onnx /home/.u2net/u2net.onnx

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt requirements.txt

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the current directory contents into the container at /app
COPY . .

# Make port 5100 available to the world outside this container
EXPOSE 5100

# Run app.py when the container launches
CMD ["python", "app.py"]
