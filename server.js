const path = require('path');
const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'storage.json'));
// Disable default body parser
const middlewares = jsonServer.defaults({ bodyParser: false });
const bodyParser = require('body-parser');

server.use(middlewares);

// Add our custom parser with a high limit
server.use(bodyParser.json({ limit: '50mb' }));
server.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// CRITICAL FIX: Mark the body as parsed so json-server's router 
// doesn't try to read the stream again, which causes "stream is not readable"
server.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        req._body = true;
    }
    next();
});

// Optional: Logging request sizes
server.use((req, res, next) => {
    if (['PATCH', 'PUT'].includes(req.method) && req.body) {
        const size = (JSON.stringify(req.body).length / 1024 / 1024).toFixed(2);
        console.log(`📥 Incoming ${req.method} to ${req.url} - Size: ${size} MB`);
    }
    next();
});

server.use(router);

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`\n-----------------------------------------`);
    console.log(`🚀 POSTPAL JSON SERVER IS ONLINE`);
    console.log(`📡 PORT: ${PORT}`);
    console.log(`📂 WATCHING: storage.json`);
    console.log(`🧱 BODY LIMIT: 50MB`);
    console.log(`-----------------------------------------\n`);
});
