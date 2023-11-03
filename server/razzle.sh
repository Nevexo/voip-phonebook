export VENDOR_SERVICE_SOCKET_PORT=3000
export FRONTEND_SERVICE_SOCKET_PORT=3001
export API_LISTEN_PORT=8080
export LOG_LEVEL="debug"
export MONGO_URI="mongodb://localhost:27017/phonebook"

rm -rf logs/*

# Display the above environment variables only
env | grep -E 'VENDOR_SERVICE_SOCKET_PORT|FRONTEND_SERVICE_SOCKET_PORT|API_LISTEN_PORT|LOG_LEVEL|MONGO_URI'

# Setup docker-compose dev environment
docker-compose -f "../docker-compose.dev.yaml" up --build -d

echo "Razzled."