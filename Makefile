.PHONY: all build dev stop down tb

DOCKER_COMPOSE = docker compose

all: build run

# NOT FINISHED 
build:
	@echo "Building Go backend..."
	cd api && go build -o $(GO_BINARY)

dev:
	@echo "Starting tigerbeetle and PostgreSQL..."
	@./scripts/tigerbeetle.sh > logs/tigerbeetle.log 2>&1 &
	$(DOCKER_COMPOSE) up -d

stop:
	@pkill -f tigerbeetle || true 
	@$(DOCKER_COMPOSE) stop || true 
	@echo "tigerbeetle and PostreSQL exited"

down: 
	@pkill -f tigerbeetle || true 
	@rm tigerbeetle/0_0.tigerbeetle
	@$(DOCKER_COMPOSE) down -v || true 
	@echo "tigerbeetle and PostreSQL removed"

tb: 
	@./tigerbeetle/tigerbeetle repl --addresses=3001 --cluster=0
