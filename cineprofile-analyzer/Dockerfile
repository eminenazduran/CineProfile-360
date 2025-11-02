FROM python:3.11-slim
RUN pip install --no-cache-dir --upgrade pip
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV PORT=5001
EXPOSE 5001
CMD ["python", "app.py"]
