#!/usr/bin/env node
// eslint-disable-next-line strict
require('dotenv').config();
const cors = require('cors');
const argv = require('minimist')(process.argv.slice(2));
const express = require('express');
const https = require("https");
const bodyParser = require('body-parser');
const gzipProcessor = require('connect-gzip-static');
const fs = require("fs");
// const updateNotifier = require('update-notifier'); commeting this as its dependents have vulnarablities

const dataAccessAdapter = require('./src/db/dataAccessAdapter');
const databasesRoute = require('./src/routes/database');
const authMiddleware = require('./src/controllers/auth');

// notify users on new releases - https://github.com/arunbandari/mongo-gui/issues/5
// const pkg = require('./package.json');
// updateNotifier({ pkg }).notify();

// initialize app
const app = express();

// middleware for simple authorization.
app.use(authMiddleware.auth);

// serve static files form public
app.use(express.static('public'));

// process gzipped static files
app.use(gzipProcessor(__dirname + '/public'));

// enables cors
app.use(cors());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json({ limit: process.env.BODY_SIZE || '50mb' }));

// api routing
app.use('/databases', databasesRoute);

// serve home page
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));

// connect to database
dataAccessAdapter.InitDB(app);

// listen on :port once the app is connected to the MongoDB
app.once('connectedToDB', () => {
  const port = argv.p || process.env.PORT || 3001;
  const privkeyFile = argv.privkey || process.env.PRIVKEY;
  const certFile = argv.cert || process.env.CERT;
  const minTlsVersion = argv.minTLS || process.env.MIN_TLS_VERSION || 'TLSv1.2';
  const maxTlsVersion = argv.maxTLS || process.env.MAX_TLS_VERSION || 'TLSv1.3';

  const serverOptions = {
    cert: fs.readFileSync(certFile),
    key: fs.readFileSync(privkeyFile),
    maxVersion: maxTlsVersion,
    minVersion: minTlsVersion
  }

  const server = require('https').Server(serverOptions, app);
  server.listen(port, () => { 
    console.log(`[-] Server listening on port ${port}`); 
  });
});

// error handler
app.use((err, req, res, next) => {
  console.log(err);
  const error = {
    errmsg: err.errmsg,
    name: err.name,
  };
  return res.status(500).send(error);
});
