# Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN NODE_OPTIONS="--max-old-space-size=1024" npm run build

# Build backend
FROM golang:1.26-alpine AS backend-builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN apk add --no-cache gcc musl-dev && CGO_ENABLED=1 go mod tidy && CGO_ENABLED=1 go build -o main .

# Final image
FROM alpine:latest
RUN apk --no-cache add ca-certificates
RUN mkdir -p uploads
COPY --from=backend-builder /app/main .
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
EXPOSE 8080
CMD ["./main"]
