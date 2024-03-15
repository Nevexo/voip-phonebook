export VENDOR_SERVICE_SOCKET_PORT=3000
export FRONTEND_SERVICE_SOCKET_PORT=3001
export API_LISTEN_PORT=8080
export LOG_LEVEL="debug"
export MONGO_URI="mongodb://localhost:27017/phonebook"
export VENDOR_SERVICE_API_KEY="qaTzaT5UkfoeXbOjZD+osPdPWhIOj7NKth5bMGD5VaY="
export VENDOR_SERVICE_DEBUG="true"
export AUTO_DEAUTHORISE_USER_ON_DELETE="true"

rm -rf logs/*

# Display the above environment variables only
env | grep -E 'VENDOR_SERVICE_SOCKET_PORT|FRONTEND_SERVICE_SOCKET_PORT|API_LISTEN_PORT|LOG_LEVEL|MONGO_URI|VENDOR_SERVICE_API_KEY|AUTO_DEAUTHORISE_USER_ON_DELETE'

# Setup docker-compose dev environment
# docker-compose -f "../docker-compose.yaml" -f "../docker-compose.dev.yaml" up --build -d

echo "Razzled."

bun run .
