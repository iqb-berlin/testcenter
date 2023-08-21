-- resolve host name

local ip = ngx.shared.dns_cache:get("testcenter-fastauth-service");

if (not ip) then
  local dns = require "resty.dns.resolver"

  local resolver = dns:new({
    nameservers = {"127.0.0.11"}, -- default docker dns
    retrans = 5,
    timeout = 500,
  })

  local ips, err = resolver:query("testcenter-fastauth-service")
  ip = ips[1]["address"];
  if (#ips == 0) or (not ip) then
    ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
    ngx.say("Failed to resolve Redis hostname");
    ngx.log(ngx.ERR, "Failed to resolve Redis hostname: ", err)
    return ngx.exit(ngx.status)
  end

  ngx.log(ngx.ERR, "Looked up fast-auth-service IP: " .. ip);
  ngx.shared.dns_cache:set("testcenter-fastauth-service", ip)
end


-- connect to redis

local redis = require "resty.redis"
local red = redis:new()
local ok, err = red:connect(ip, 6379)
if not ok then
  ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
  ngx.say("FastAuth-Service not reachable")
  ngx.log(ngx.ERR, "Failed to connect to Redis")
  return ngx.exit(ngx.status)
end


-- authenticate!

local token = ngx.req.get_headers()['AuthToken']
if not token then
  ngx.status = ngx.HTTP_UNAUTHORIZED
  ngx.say("Auth header missing")
  ngx.log(ngx.ERR, "Auth header missing", err)
  return ngx.exit(ngx.status)
end
ngx.log(ngx.INFO, "AuthToken: " .. token)

local uri = ngx.var.uri
local ws = string.match(uri, "^/ws_(%d+)/Resource/") -- only Resources, we don't want to expose Testtakers.xml
local wsRequested = tonumber(ws)
if (wsRequested == nil) then
  ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
  ngx.say('Invalid Filepath: ', uri)
  ngx.log(ngx.ERR, 'Invalid Filepath: ' .. uri, err)
  return ngx.exit(ngx.status)
end
ngx.log(ngx.INFO, "Requested ws: ", wsRequested)

local response, err = red:get(token)
local workspaceAllowed = tonumber(response)

if workspaceAllowed ~= nil then
  if workspaceAllowed ~= wsRequested then
    ngx.status = ngx.HTTP_FORBIDDEN
    ngx.say("Workspace not allowed: " .. wsRequested)
    return ngx.exit(ngx.status)
  end
  -- everything okay!
elseif err ~= nil then
  ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
  ngx.say('Authentication Error')
  ngx.log(ngx.ERR, "Error: ", err)
  return ngx.exit(ngx.status)
else
  ngx.status = ngx.HTTP_FORBIDDEN
  ngx.say('Invalid Token')
  return ngx.exit(ngx.status)
end