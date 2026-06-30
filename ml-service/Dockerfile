# Use a lightweight official Python image
FROM python:3.9-slim

# Set up a non-root user with UID 1000 (Hugging Face requirement)
RUN useradd -m -u 1000 user

# Set the working directory
WORKDIR /code

# Copy the dependencies file and install them
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy the rest of the application files
COPY . /code

# Adjust permissions for the non-root user
RUN chown -R user:user /code

# Switch to the non-root user
USER user

# Start the uvicorn server on port 7860 (Hugging Face default)
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
