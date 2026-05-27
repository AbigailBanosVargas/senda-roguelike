const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const WEBP_HEADER = Buffer.from([0x52, 0x49, 0x46, 0x46]);

http.createServer((req, res) => {
  const url = req.url === '/' ? './index.html' : '.' + req.url;
  const ext = path.extname(url);

  fs.readFile(url, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }

    let contentType = MIME[ext] || 'application/octet-stream';

    if (ext === '.png' && data.length > 4 &&
        data[0] === WEBP_HEADER[0] && data[1] === WEBP_HEADER[1] &&
        data[2] === WEBP_HEADER[2] && data[3] === WEBP_HEADER[3]) {
      contentType = 'image/webp';
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}).listen(8080, () => console.log('Server running at http://localhost:8080'));
