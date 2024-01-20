# Use the bun runtime as the base image
FROM oven/bun:1

# Set the working directory to the code directory
WORKDIR /app

# Copy all source code.
COPY . /app

# Install the dependencies
RUN bun install --production --frozen-lockfile --ignore-scripts --no-save --no-package-lock

# Run the server
CMD ["bun", "start"]