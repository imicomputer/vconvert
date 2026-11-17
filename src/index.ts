import app from './app.js';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { initializeContainer, getHardwareDetector } from './utils/container.js';

async function startServer() {
  try {
    // Initialize DI container and services
    await initializeContainer();

    // Perform hardware detection at startup
    const hardwareDetector = getHardwareDetector();
    const hardwareStatus = await hardwareDetector.detectAvailableAccelerators();
    logger.info(`Hardware Status: NVIDIA=${hardwareStatus.nvidia}, AMD=${hardwareStatus.amd}, Active=${hardwareStatus.activeAccelerator}`);

    // Start HTTP server
    const port = config.port;
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Visit: http://localhost:${port}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

startServer();
