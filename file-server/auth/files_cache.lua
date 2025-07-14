local files_cache = {}

function files_cache.load(filePath)
  ngx.log(ngx.DEBUG, 'Loading from cache: ' .. filePath)

  local redis_connector = require 'redis_connector'
  local redis = redis_connector.connect()

  local fileContents, err = redis:get('file:' .. filePath)
  redis:close()

  if err ~= nil then
    ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
    ngx.say('Could not read cache: ', uri)
    ngx.log(ngx.ERR, 'Could not read cache: ' .. uri, err)
    return ngx.exit(ngx.status)
  end

  if fileContents == ngx.null then
    return; -- nil!
  end

  return fileContents;
end

return files_cache