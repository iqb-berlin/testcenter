local redis_connector = require 'redis_connector'
local redis = redis_connector.connect()

local uri = ngx.var.uri

-- authenticate!

local fileName
local token

token, wsId, fileName = string.match(uri, "^/file/([^/]+)/ws_(%d+)/Resource/(.+)$")

if not token then
  ngx.status = ngx.HTTP_UNAUTHORIZED
  ngx.say("Auth token missing")
  ngx.log(ngx.DEBUG, "Auth token missing", err)
  return ngx.exit(ngx.status)
end

ngx.log(ngx.DEBUG, "AuthToken: " .. token)

local wsRequested = tonumber(wsId)
if (wsRequested == nil) then
  ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
  ngx.say('Invalid Filepath: ', uri)
  ngx.log(ngx.DEBUG, 'Invalid Filepath: ' .. uri, err)
  return ngx.exit(ngx.status)
end

ngx.log(ngx.DEBUG, "Requested ws: ", wsRequested)

local response, err = redis:get('group-token:' .. token)
redis:close()
local workspaceAllowed = tonumber(response)

if err ~= nil then
  ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
  ngx.say('Authentication Error')
  ngx.log(ngx.DEBUG, "Error: ", err)
  return ngx.exit(ngx.status)
end

if workspaceAllowed == nil then
  ngx.status = ngx.HTTP_FORBIDDEN
  ngx.say('Invalid Token: ' .. token)
  return ngx.exit(ngx.status)
end

if workspaceAllowed ~= wsRequested then
  ngx.status = ngx.HTTP_FORBIDDEN
  ngx.say("Workspace not allowed: " .. wsRequested)
  return ngx.exit(ngx.status)
end

-- everything OK: serve file from cache of fs

local filePath = '/ws_' .. wsRequested .. '/Resource/' .. fileName
ngx.var.file_path = filePath
ngx.req.set_uri(filePath)