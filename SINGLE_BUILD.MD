cd ~/cibf-reservation-system
git pull origin main
docker-compose stop reservation-service
docker-compose rm -f reservation-service
docker pull kavindasandamal/reservation-service:latest
docker-compose up -d reservation-service
docker-compose logs -f reservation-service
