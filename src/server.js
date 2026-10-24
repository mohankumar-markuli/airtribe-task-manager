
require('dotenv').config();

const app = require('./app');

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
    console.log(`Task Manager API listening on port ${PORT}`);
});

function shutdown(signal) {
    console.log(`${signal} received. Shutting down server...`);

    server.close((error) => {
        if (error) {
            console.error('Error while shutting down:', error);
            process.exitCode = 1;
            return;
        }

        process.exitCode = 0;
    });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
