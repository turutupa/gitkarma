# Use the official Golang image to build the application
FROM golang:1.20 AS builder

# Set the working directory
WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the Go application
RUN go build -o main .

# Use a minimal base image for the final stage
FROM gcr.io/distroless/base-debian10

# Set the working directory
WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/main .

# Expose the port the Go application listens on
EXPOSE 4000

# Start the Go application
CMD ["/app/main"]
