FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose all possible ports
EXPOSE 8001 8002 8003 8004

# Default to identity service, overridden in docker-compose
CMD ["uvicorn", "services.identity:app", "--host", "0.0.0.0", "--port", "8001"]
