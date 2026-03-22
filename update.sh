
git pull origin main

docker-compose down --remove-orphans

docker-compose up -d --build

sleep 3

curl http://localhost:20260/health
