FROM python:3.11-slim

# Install system dependencies
# libreoffice-writer: for docx -> pdf
# default-jre: java runtime needed for libreoffice
RUN apt-get update && apt-get install -y \
    libreoffice-writer \
    default-jre \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Frontend
COPY frontend /app/frontend

# Copy Backend
COPY backend /app/backend

# Set working directory to backend so paths are relative as expected
WORKDIR /app/backend

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose port
EXPOSE 8000

# Run the application
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]