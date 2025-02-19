.PHONY: all build dev stop tb

DOCKER_COMPOSE = docker compose

all: build run

# NOT FINISHED 
build:
	@echo "Building Go backend..."
	cd api && go build -o $(GO_BINARY)

dev:
	@echo "Starting tigerbeetle and PostgreSQL..."
	@./scripts/run_tb.sh > logs/tigerbeetle.log 2>&1 &
	$(DOCKER_COMPOSE) up -d

stop:
	@pkill -f tigerbeetle || true 
	@$(DOCKER_COMPOSE) stop || true 
	@echo "tigerbeetle and PostreSQL exited"

tb: 
	@./tigerbeetle/tigerbeetle repl --addresses=3001 --cluster=0