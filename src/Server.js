const express = require('express');
const bodyParser = require('body-parser');

module.exports = class Server {
  constructor(config, taskManager, taskExecutor) {
    this.app = express();
    this.config = config;
    this.taskManager = taskManager;
    this.taskExecutor = taskExecutor;

    this.app.use(bodyParser.json());

    this.app.post('/echoAtTime', this.echoAtTime.bind(this));
  }

  echoAtTime(req, res, next) {
    const { unixTime, message } = req.body;

    this.taskManager
      .createTask(this.taskExecutor.createEchoTask(unixTime, message))
      .then((response) => res.end(JSON.stringify(response)))
      .catch(next);
  }

  async init() {
    await new Promise((resolve) => this.app.listen(this.config.server.port, resolve));
  }
};
