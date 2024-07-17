export LISTEN_PORT=8083
export SOCKET_URL="ws://localhost:3000"
export LOG_LEVEL=debug
export SOCKET_API_KEY="qaTzaT5UkfoeXbOjZD+osPdPWhIOj7NKth5bMGD5VaY="
export EXTERNAL_URL="http://localhost:8083"

rm -rf logs/*

# Display the above environment variables only
env | grep -E 'LISTEN_PORT|SOCKET_URL|LOG_LEVEL|SOCKET_API_KEY|EXTERNAL_URL'

echo "Razzled."

bun run .
