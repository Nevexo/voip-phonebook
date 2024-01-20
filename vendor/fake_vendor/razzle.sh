export LISTEN_PORT=8081
export SOCKET_URL="ws://localhost:3000"
export LOG_LEVEL=debug
export SOCKET_API_KEY="qaTzaT5UkfoeXbOjZD+osPdPWhIOj7NKth5bMGD5VaY="

rm -rf logs/*

# Display the above environment variables only
env | grep -E 'LISTEN_PORT|SOCKET_URL|LOG_LEVEL|SOCKET_API_KEY'

echo "Razzled."

bun run .