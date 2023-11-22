local redis_connector = {}

function redis_connector.connect()
  -- resolve host name
  local ip = ngx.shared.dns_cache:get("testcenter-cache-service")

  if (not ip) then
    local dns = require "resty.dns.resolver"

    local resolver = dns:new({
      nameservers = {"127.0.0.11"}, -- default docker dns
      retrans = 5,
      timeout = 500,
    })

    local ips, err = resolver:query("testcenter-cache-service")
    ip = ips[1]["address"]
    if (#ips == 0) or (not ip) then
      ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
      ngx.say("Failed to resolve Redis hostname")
      ngx.log(ngx.ERR, "Failed to resolve Redis hostname: ", err)
      return ngx.exit(ngx.status)
    end

    ngx.log(ngx.INFO, "Looked up cache-service IP: " .. ip)
    ngx.shared.dns_cache:set("testcenter-cache-service", ip)
  end

  -- connect to redis
  local redis = require "resty.redis"
  local red = redis:new()
  local ok, err = red:connect(ip, 6379, {
    pool_size = 20
  })
  if not ok then
    ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
    ngx.say("Cache-Service not reachable")
    ngx.log(ngx.ERR, "Failed to connect to Redis")
    return ngx.exit(ngx.status)
  end

  return red
end

return redis_connector