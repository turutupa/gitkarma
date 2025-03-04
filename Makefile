.PHONY: all build dev stop down tb

DOCKER_COMPOSE = docker compose
TIGERBEETLE = "🪲  Tigerbeetle"
POSTGRESQL = "🏗️ PostgreSQL"
CHEVRON = \\033[1m»\\033[0m

all: build run

# wip 
build:
	@echo "Building Go backend..."
	cd api && go build -o $(GO_BINARY)

dev:
	@echo "\n🚀 \033[1mStarting tigerbeetle and PostgreSQL...\033[0m"
	@mkdir -p logs
	@./scripts/tigerbeetle.sh > logs/tigerbeetle_$(shell date +%Y%m%d).log 2>&1 &
	@$(DOCKER_COMPOSE) up > logs/docker_$(shell date +%Y%m%d).log 2>&1 &

status:
	@echo "\n\033[1mStatus\033[0m"
	@if lsof -i:3001 > /dev/null; \
		then echo "  $(CHEVRON) $(TIGERBEETLE) is running"; \
		else echo "  $(CHEVRON) $(TIGERBEETLE) is not running"; fi
	@if lsof -i:5432 > /dev/null; \
		then echo "  $(CHEVRON) $(POSTGRESQL) is running"; \
		else echo "  $(CHEVRON) $(POSTGRESQL) is not running"; fi

stop:
	@pkill -f tigerbeetle || true 
	@$(DOCKER_COMPOSE) stop || true 
	@echo "\n\033[1m$(TIGERBEETLE) and $(POSTGRESQL) exited\033[0m"

down: 
	@pkill -f tigerbeetle || true 
	@rm tigerbeetle/0_0.tigerbeetle
	@$(DOCKER_COMPOSE) down -v || true 
	@echo "tigerbeetle and PostreSQL removed"

.PHONY: logs
logs:    
	@tail -F logs/docker_$(shell date +%Y%m%d).log logs/tigerbeetle_$(shell date +%Y%m%d).log | less -R

tb: 
	@./tigerbeetle/tigerbeetle repl --addresses=3001 --cluster=0
