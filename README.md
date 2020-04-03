# Task executor

This projects show how could you use redis to run tasks at exact point of time by providing dummy backend with just one endpoint.

It supports load balancing / scaling, multiple instances and server shutdown. It is guaranteed that task will be executed at least once, but it could be executed multiple times due to network instabilities / app crash.

Action will be always executed after provided time, and in same order as they were defined in redis.

Order is not guaranteed between multiple instances 

# How to use

## Startup
Copy contents of provided .env.local to .env file, and then
```bash
npm start
```
in your favorite terminal. 


## Endpoints

```
POST /echoAtTime
{
  unixTime: number, // unix timestamp in seconds
  message: any, // message to write to console
}
```

## Watching ~~paint dry~~ console
Now after you send a request to queue message you should watch at your console and wait for message.

# How it works

It uses ordered set of redis, and ZRangeByScore with limits and LUA script to retrieve jobs from redis.

## Possible improvements

- Re-scheduler wasn't implemented for simplicity. It should work same way as main queue, but instead of executing task it would add it back up to queue
- Peek'ing first by score item in the set, and having setTimeout that would delay by that time instead of running check each 10 milliseconds. Would improve performance and decrease load on Redis ( Especially with long queues, or with many instances of this service )
- Logging. Currently it's entirely missing for simplicity

## Limitations

Score of ZRangeByScore is limited to float64, thus this queue will break after year 128724 ( Safe limit of float64 without lose of time precision )
