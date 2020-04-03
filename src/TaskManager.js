module.exports = class TaskManager {
  constructor(config, taskExecutor) {
    this.config = config.taskManager;
    this.redis = config.provideRedis();
    this.taskExecutor = taskExecutor;
  }

  async init() {
    return Promise.all([
      this.initCreateTaskScript(),
      this.initLoadTasksScript(),
      this.initRescheduleTasksScript(),
      this.initRemoveRescheduleScript(),
    ])
      .then(() => this.startScheduler());
  }

  startScheduler() {
    setInterval(() => this.checkTasks(), this.config.checkInternal);
  }

  async checkTasks() {
    const now = Date.now();

    const tasks = await this.redis.loadTasks(
      this.config.taskSetKey,
      this.config.taskRescheduleKey,
      this.config.batchSize,
      now,
      now + this.config.rescheduleTimeout,
    );
    if (tasks.length === 0) {
      return;
    }

    // Each second key is time at witch we want to execute ( aka score )
    // This is to ignore it
    for (let i = 0; i < tasks.length; i += 2) {
      const taskDefinition = tasks[i];
      const id = Number.parseInt(taskDefinition.substr(0, 16), 16);
      const taskData = taskDefinition.substr(17);
      this.taskExecutor.executeTask(id, JSON.parse(taskData));
    }
  }

  async createTask(task) {
    const [id] = await this.redis.createTask(
      this.config.taskSetKey,
      this.config.taskIdKey,
      task.executeAt.valueOf(),
      JSON.stringify(task.data),
    );

    return {
      status: 'queued',
      id,
    };
  }

  initCreateTaskScript() {
    return this.redis.defineCommand('createTask', {
      numberOfKeys: 2,
      lua: `
        local setKey = KEYS[1]
        local idKey = KEYS[2]

        local taskTimestamp = tonumber(ARGV[1])
        local taskData = ARGV[2]

        local id = redis.call("INCR", idKey)
        local taskValue = string.format("%016x %s", id, taskData)

        return {id, redis.call("ZADD", setKey, taskTimestamp, taskValue), taskTimestamp, unpack(ARGV)}
      `,
    });
  }

  initLoadTasksScript() {
    return this.redis.defineCommand('loadTasks', {
      numberOfKeys: 2,
      lua: `
        local setKey = KEYS[1]
        local rescheduleKey = KEYS[2]

        local batchSize = tonumber(ARGV[1])
        local maxTimestamp = tonumber(ARGV[2])
        local rescheduleAt = tonumber(ARGV[3])

        -- return { batchSize, maxTimestamp, rescheduleAt, unpack(ARGV) }
        -- ZREM doesn't support limits, and we need batching as multiple service instances could peek same queue
        local tasks = redis.call("ZRANGEBYSCORE", setKey, 0, maxTimestamp, "WITHSCORES", "LIMIT", 0, batchSize)
        if #tasks == 0 then
          return {}
        end

        -- If anything happens during task execution we would want to reschedule it later on 
        -- local rescheduleValues = {}
        local removeValues = {}
        for index = 1, #tasks, 2 do
          -- rescheduleValues[#rescheduleValues] = string.format("%016x %s", tonumber(tasks[index + 1]), tasks[index])
          table.insert(removeValues, tasks[index])
        end

        redis.call("ZREM", setKey, unpack(removeValues))
        -- redis.call("ZADD", rescheduleKey, rescheduleAt, unpack(rescheduleValues))

        return tasks
      `,
    });
  }

  // eslint-disable-next-line class-methods-use-this
  initRescheduleTasksScript() {
    // TODO: Someone implement this one, please.
  }

  // eslint-disable-next-line class-methods-use-this
  initRemoveRescheduleScript() {
    // TODO: Someone implement this one, please.
  }
};
