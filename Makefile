.PHONY: prod build dev stop down tb logs

DOCKER_COMPOSE = docker compose -f docker-compose.yml
DOCKER_COMPOSE_DEV = docker compose -f docker-compose.dev.yml
TIGERBEETLE = "🪲  Tigerbeetle"
POSTGRESQL = "🏗️ PostgreSQL"
API = "📦 API"
CHEVRON = \\033[1m»\\033[0m

# prod: build run

# wip 
prod:
	@pkill -f tigerbeetle || true &
	@echo "\n🚀 \033[1mStarting tigerbeetle, PostgreSQL, webapp and github app...\033[0m"
	@mkdir -p logs
	@./scripts/tigerbeetle.sh >> logs/tigerbeetle_$(shell date +%Y%m%d).log 2>&1 &
	@$(DOCKER_COMPOSE) up --build >> logs/docker_$(shell date +%Y%m%d).log 2>&1 &

status:
	@echo "\n\033[1mStatus\033[0m"
	@if lsof -i:3001 > /dev/null; \
		then echo "  $(CHEVRON) $(TIGERBEETLE) is running"; \
		else echo "  $(CHEVRON) $(TIGERBEETLE) is not running"; fi
	@if lsof -i:5432 > /dev/null; \
		then echo "  $(CHEVRON) $(POSTGRESQL) is running"; \
		else echo "  $(CHEVRON) $(POSTGRESQL) is not running"; fi

prodstop:
	@echo "\n\033[1mStatus\033[0m"
	@pkill -f tigerbeetle || true &
	@$(DOCKER_COMPOSE) stop > /dev/null 2>&1 &
	@echo "  $(CHEVRON) $(TIGERBEETLE) stopped"
	@echo "  $(CHEVRON) $(POSTGRESQL) stopped"
	@echo "  $(CHEVRON) $(API) stopped"

dev:
	@echo "\n🚀 \033[1mStarting tigerbeetle and PostgreSQL...\033[0m"
	@mkdir -p logs
	@./scripts/tigerbeetle.sh >> logs/tigerbeetle_$(shell date +%Y%m%d).log 2>&1 &
	@$(DOCKER_COMPOSE_DEV) up >> logs/docker_$(shell date +%Y%m%d).log 2>&1 &

devstop:
	@echo "\n\033[1mStatus\033[0m"
	@pkill -f tigerbeetle || true &
	@$(DOCKER_COMPOSE_DEV) stop > /dev/null 2>&1 &
	@echo "  $(CHEVRON) $(TIGERBEETLE) stopped"
	@echo "  $(CHEVRON) $(POSTGRESQL) stopped"

devdown: 
	@pkill -f tigerbeetle || true 
	@rm tigerbeetle/0_0.tigerbeetle
	@$(DOCKER_COMPOSE_DEV) down -v || true 
	@echo "tigerbeetle and PostreSQL removed"

logs:    
	@tail -F logs/docker_$(shell date +%Y%m%d).log logs/tigerbeetle_$(shell date +%Y%m%d).log | less -R

tb: 
	@./tigerbeetle/tigerbeetle repl --addresses=3001 --cluster=0
