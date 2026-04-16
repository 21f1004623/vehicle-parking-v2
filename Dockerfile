FROM python:3.11-slim

# Install gcc needed by some pip packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

# Persistent data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 5000

CMD ["python", "main.py"]
