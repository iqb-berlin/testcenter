local redis_connector = require 'redis_connector'
local redis = redis_connector.connect()

local uri = ngx.var.uri

-- authenticate!

local fileName
local token

token, wsId, fileName = string.match(uri, "^/resource/([^/]+)/ws_(%d+)/Resource/(.+)$")

if not token then
  ngx.status = ngx.HTTP_UNAUTHORIZED
  ngx.say("Auth header missing")
  ngx.log(ngx.INFO, "Auth header missing", err)
  return ngx.exit(ngx.status)
end

ngx.log(ngx.INFO, "AuthToken: " .. token)

local wsRequested = tonumber(wsId)
if (wsRequested == nil) then
  ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
  ngx.say('Invalid Filepath: ', uri)
  ngx.log(ngx.INFO, 'Invalid Filepath: ' .. uri, err)
  return ngx.exit(ngx.status)
end

ngx.log(ngx.INFO, "Requested ws: ", wsRequested)

local response, err = redis:get(token)
local workspaceAllowed = tonumber(response)

if workspaceAllowed ~= nil then
  if workspaceAllowed ~= wsRequested then
    ngx.status = ngx.HTTP_FORBIDDEN
    ngx.say("Workspace not allowed: " .. wsRequested)
    return ngx.exit(ngx.status)
  end
  ngx.req.set_uri('/ws_' .. wsRequested .. '/Resource/' .. fileName);
  -- everything okay!
elseif err ~= nil then
  ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
  ngx.say('Authentication Error')
  ngx.log(ngx.INFO, "Error: ", err)
  return ngx.exit(ngx.status)
else
  ngx.status = ngx.HTTP_FORBIDDEN
  ngx.say('Invalid Token')
  return ngx.exit(ngx.status)
end

