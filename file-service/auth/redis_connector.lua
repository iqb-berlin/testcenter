local redis_connector = {}

function redis_connector.connect()
  -- connect to redis
  local redis = require "resty.redis"
  local red = redis:new()
  local ok, err = red:connect(os.getenv("REDIS_HOST"), os.getenv("REDIS_PORT"), {
    pool_size = 20
  })
  if not ok then
    ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
    ngx.say("Cache-Service not reachable")
    ngx.log(ngx.ERR, "Failed to connect to Redis")
    return ngx.exit(ngx.status)
  end

  local res, err = red:auth(os.getenv("REDIS_PASSWORD"))
  if not res then
      ngx.say("Failed to authenticate: ", err)
      return ngx.exit(ngx.status)
  end

  return red
end

return redis_connector
