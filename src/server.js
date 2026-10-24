
require('dotenv').config();
const { initSocket } = require('./socket');

const app = require('./app');
const {
    connectDatabase,
    disconnectDatabase,
} = require('./config/database');

const PORT = Number(process.env.PORT) || 3000;

let server;
let isShuttingDown = false;

async function startServer() {
    await connectDatabase();

    server = app.listen(PORT, () => {
        console.log(`Task Manager API listening on port ${PORT}`);
        // Initialise Socket.io with the HTTP server
        const io = initSocket(server, app);
        // Optionally expose via app locals (already set inside initSocket)
    });
}

async function shutdown(signal) {
    if (isShuttingDown) {
        return;
    }

    isShuttingDown = true;
    console.log(`${signal} received. Shutting down server...`);

    try {
        if (server) {
            await new Promise((resolve, reject) => {
                server.close((error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
        }

        await disconnectDatabase();
        process.exitCode = 0;
    } catch (error) {
        console.error('Error while shutting down:', error.message);
        process.exitCode = 1;
    }
}

process.on('SIGINT', () => {
    void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
});

startServer().catch((error) => {
    console.error('Failed to start the application:', error.message);
    process.exitCode = 1;
});
