.PHONY: all build run stop start-databases

# Variables
DOCKER_COMPOSE = docker-compose
NGROK_PORT = 4000
GO_PORT = 4000
GO_BINARY = main
PID_FILE = .pid

all: build run

# NOT FINISHED 
build:
	@echo "Building Go backend..."
	cd api && go build -o $(GO_BINARY)

# WORKING FOR TMUX USERS 
dev: 
	@echo "Starting Go server and ngrok..."
	@./start.sh 

# MIGHT NEED SOME TWEAKING (stop tiger beetle hasn't been tested yet)
stop:
	@echo "Stopping Go server and ngrok..."
	@pkill -f ./main || true
	@pkill -f ngrok || true
	@pkill -f tigerbeetle || true 
	@$(DOCKER_COMPOSE) down || true

# NOT FINISHED
start-databases:
	@echo "Starting databases..."
	$(DOCKER_COMPOSE) up -d

