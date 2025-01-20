# RSS Watcher

A modern web application for monitoring RSS feeds and receiving notifications when new posts match your keywords. Built with React, Express, and TypeScript.

## Features

- 🔍 Monitor multiple RSS feeds simultaneously
- 🔑 Define custom keywords for each feed
- 🔔 Real-time notifications via [ntfy.sh](https://ntfy.sh)
- ⏰ Configurable check intervals
- 📱 Responsive web interface

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ablomer/rsswatcher.git
cd rsswatcher
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
```

### Production

Build and start the production server:

```bash
npm run build
npm start
# or
yarn build
yarn start
```

Once the server is running, visit `http://localhost:3000` in your browser to access the web interface.

## Configuration

All configuration is managed through the web interface:

### Feed Management
- Add, edit, or remove RSS feeds through the "Feeds" tab
- Set keywords for each feed to monitor
- View feed status and history

### Settings
- Configure ntfy.sh notification settings in the "Settings" tab
  - Set your ntfy topic
  - Configure ntfy server address (defaults to https://ntfy.sh)
  - Adjust feed check interval

### Environment Variables

The application uses the following environment variables:

- `RSS_WATCHER_DATA_DIR`: Path to the directory where application data (configuration and history) is stored
  - Default: `/app/data`
  - Example: `/home/user/rsswatcher/data`

## Docker Support

Build the Docker image:

```bash
docker build -t rsswatcher .
```

Run the container:

```bash
# Create a directory for persistent data
mkdir -p data

# Run the container with mounted data directory
docker run -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  rsswatcher
```
This will persist all application data (configuration and history) across container restarts.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License (see the [LICENSE](LICENSE) file for details).
