#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
SERVICE_NAME="viralzera_app"
STACK_NAME="viralzera"

echo "============================================"
echo "  DEPLOY: Viralzera"
echo "============================================"

# Verificar .env
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "ERRO: Arquivo .env não encontrado em $SCRIPT_DIR/.env"
    echo "Copie .env.example para .env e preencha as variáveis."
    exit 1
fi

# [1/4] Build
echo ""
echo "[1/4] Building Docker image..."
docker build -t viralzera:latest -f "$SCRIPT_DIR/Dockerfile" "$APP_DIR"

# [2/4] Deploy stack
echo ""
echo "[2/4] Deploying stack to Swarm..."
docker stack deploy -c "$SCRIPT_DIR/docker-compose.yml" "$STACK_NAME"

# [2.5/4] Force update (OBRIGATÓRIO — Docker Swarm não detecta mudança com mesma tag)
echo ""
echo "[2.5/4] Forcing service update..."
docker service update --force "${SERVICE_NAME}"

# [3/4] Health check
echo ""
echo "[3/4] Waiting for service to become healthy..."
ELAPSED=0
TIMEOUT=120
while [ $ELAPSED -lt $TIMEOUT ]; do
    RUNNING=$(docker service ls 2>/dev/null | grep "${SERVICE_NAME}" | awk '{print $4}' | grep -c "1/1" || true)
    if [ "$RUNNING" -eq 1 ]; then
        echo "Service is healthy! (${ELAPSED}s)"
        break
    fi
    echo "  Waiting... (${ELAPSED}s / ${TIMEOUT}s)"
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    echo ""
    echo "ERRO: Service não ficou healthy em ${TIMEOUT}s"
    echo "Últimos logs:"
    docker service logs "${SERVICE_NAME}" --tail=50
    exit 1
fi

# [4/4] Database migrations (Prisma)
echo ""
echo "[4/4] Running Prisma migrations..."
CONTAINER_ID=$(docker ps -q -f name="${SERVICE_NAME}" | head -1)
if [ -n "$CONTAINER_ID" ]; then
    docker exec "$CONTAINER_ID" npx prisma migrate deploy
    echo "Migrations applied!"
else
    echo "WARN: Container não encontrado, pulando migrations."
    echo "Execute manualmente: docker exec <container_id> npx prisma migrate deploy"
fi

echo ""
echo "============================================"
echo "  DEPLOY COMPLETE!"
echo "============================================"

# Limpeza de imagens dangling
docker image prune -f 2>/dev/null || true
