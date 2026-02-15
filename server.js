const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const app = express();

// Use port 0 to let the OS assign a random available port
const port = 0;

// Serve static files from the current directory (snapshot or local)
app.use(express.static(path.join(__dirname)));

const startTimestamp = process.hrtime();

const server = app.listen(port, () => {
  const diff = process.hrtime(startTimestamp);
  const startupTime = (diff[0] * 1e9 + diff[1]) / 1e6; // ms

  const address = server.address();
  const url = `http://localhost:${address.port}/index.html`;
  console.log(`Baroid Hub running at ${url}`);
  console.log(`Startup Time: ${startupTime.toFixed(2)}ms`);

  const used = process.memoryUsage();
  console.log(`Memory Usage: RSS ${(used.rss / 1024 / 1024).toFixed(2)} MB, Heap ${(used.heapUsed / 1024 / 1024).toFixed(2)} MB`);

  // Open URL in default browser
  // const start = (process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open');
  // exec(`${start} ${url}`);

  process.exit(0); // Exit after benchmark
});
