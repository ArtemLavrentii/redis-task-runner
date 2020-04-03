require('dotenv')
  .config();

const Server = require('./Server');
const Config = require('./Config');
const TaskManager = require('./TaskManager');
const TaskExecutor = require('./TaskExecutor');


async function createServer() {
  const config = new Config();
  const taskManager = new TaskManager(config, TaskExecutor);

  await taskManager.init();

  const server = new Server(config, taskManager, TaskExecutor);
  await server.init();

  const now = Date.now();
  await Promise.all([
    taskManager.createTask(TaskExecutor.createEchoTask(new Date(now + 500), 'Hello world')),
    taskManager.createTask(TaskExecutor.createEchoTask(new Date(now + 500), 'This should be after Hello world')),
    taskManager.createTask(TaskExecutor.createEchoTask(new Date(now + 499), 'This should be before Hello world')),
    taskManager.createTask(TaskExecutor.createEchoTask(new Date(now + 550), 'This should be ~50ms after Hello world')),
    taskManager.createTask(TaskExecutor.createEchoTask(new Date(now + 5000), 'Server started up 5 seconds ago')),
  ]);
}

createServer()
  .catch(console.error);
