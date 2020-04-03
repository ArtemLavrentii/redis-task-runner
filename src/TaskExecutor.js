const Task = require('./Task');

module.exports = class TaskExecutor {
  static executeTask(id, { type, message }) {
    if (type !== 'echo') {
      throw new Error(`Unknown task type: ${type}'`);
    }

    let stringifiedMessage = message;
    if (typeof stringifiedMessage !== 'string') {
      stringifiedMessage = JSON.stringify(message);
    }

    process.stdout.write(stringifiedMessage);
    process.stdout.write('\n');
  }

  static createEchoTask(executeAt, message) {
    return new Task(executeAt, { type: 'echo', message });
  }
};
