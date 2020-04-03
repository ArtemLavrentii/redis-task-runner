const Redis = require('ioredis');

module.exports = class Config {
  string(name) {
    const value = this.storage[name];

    if (value === undefined) {
      throw new Error(`Value not found @${name}`);
    }

    return value;
  }

  number(name) {
    const value = this.string(name);

    const result = Number.parseInt(value, 10);
    if (Number.isNaN(result)) {
      throw new Error(`Value isn't a number: ${value}@${name}`);
    }

    return result;
  }

  constructor() {
    this.storage = process.env;
    this.redis = {
      url: this.string('REDIS_URL'),
    };

    this.server = {
      port: this.number('SERVER_PORT'),
    };

    this.taskManager = {
      taskIdKey: this.string('TASK_MANAGER_TASK_ID_KEY'),
      taskSetKey: this.string('TASK_MANAGER_TASK_SET_KEY'),
      taskRescheduleKey: this.string('TASK_MANAGER_TASK_RESCHEDULE_KEY'),
      rescheduleTimeout: this.number('TASK_MANAGER_RESCHEDULE_TIMEOUT'),
      checkInternal: this.number('TASK_MANAGER_CHECK_INTERVAL'),
      batchSize: this.number('TASK_MANAGER_BATCH_SIZE'),
    };
  }

  provideRedis() {
    return new Redis(this.redis.url);
  }
};
