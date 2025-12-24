import express from 'express';
import * as path from 'path';
import { InstallerService, APP_CONFIG } from './service';
import { exec } from 'child_process';
import { getInstallerHTML } from './ui-template';

export function startInstallerServer(port: number = 3000) {
  const app = express();
  const service = new InstallerService();

  app.use(express.json());
  
  // Serve the installer UI HTML directly
  app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(getInstallerHTML());
  });

  // API Endpoints
  app.get('/api/config', (req, res) => {
    res.json(APP_CONFIG);
  });

  app.get('/api/state', (req, res) => {
    res.json(service.getState());
  });

  app.post('/api/path', (req, res) => {
    const { path } = req.body;
    if (path) {
      service.setInstallPath(path);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Path is required' });
    }
  });

  app.post('/api/components', (req, res) => {
    const { components } = req.body;
    if (components) {
      service.setComponents(components);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Components are required' });
    }
  });

  app.post('/api/install', async (req, res) => {
    try {
      const result = await service.startInstallation();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/progress', (req, res) => {
    const state = service.getState();
    res.json({
      progress: state.installationProgress,
      message: state.currentMessage,
      error: state.error
    });
  });

  app.post('/api/browse', async (req, res) => {
    const path = await service.browsePath();
    res.json({ path });
  });

  app.post('/api/launch', (req, res) => {
    service.launchApplication();
    res.json({ success: true });
    setTimeout(() => process.exit(0), 1000);
  });

  app.post('/api/exit', (req, res) => {
    res.json({ success: true });
    console.log('Installer closing via API...');
    setTimeout(() => {
      server.close();
      process.exit(0);
    }, 1000);
  });

  // Start server
  const server = app.listen(port, () => {
    console.log(`Installer UI running at http://localhost:${port}`);
    console.log(`Press Ctrl+C to close the installer`);
    
    // Open browser
    const startCommand = process.platform === 'win32' ? 'start' : 'open';
    exec(`${startCommand} http://localhost:${port}`);
  });

  // Keep the process alive - don't exit on SIGINT unless requested
  let shutdownRequested = false;
  
  process.on('SIGINT', () => {
    if (!shutdownRequested) {
      shutdownRequested = true;
      console.log('\nClosing installer...');
      server.close();
      process.exit(0);
    }
  });

  process.on('SIGTERM', () => {
    server.close();
    process.exit(0);
  });

  return server;
}
