-- Object-store mode (read path B): the bytes live in the bucket, not on disk.
-- Ask the backend to mint a presigned URL for the already-authorized request
-- (auth.lua ran first), then redirect the client straight to the object store.
local objectStore = os.getenv("OBJECT_STORE_ENABLED")

if (objectStore ~= nil)
  and ((objectStore:lower() == 'yes')
    or (objectStore:lower() == 'on')
    or (objectStore:lower() == 'true')
    or (objectStore == '1'))
then
  local res = ngx.location.capture('/__objectstore_presign' .. ngx.var.request_uri)

  local location = res and res.header and res.header["Location"]
  if (res.status == ngx.HTTP_MOVED_TEMPORARILY) and location then
    return ngx.redirect(location, ngx.HTTP_MOVED_TEMPORARILY)
  end

  ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
  ngx.log(ngx.ERR, 'Object-store presign failed, status: ' .. tostring(res and res.status))
  ngx.say('Could not resolve object-store URL')
  return ngx.exit(ngx.status)
end

local includeFiles = os.getenv("REDIS_CACHE_FILES")

if (includeFiles ~= nil)
  and (includeFiles:lower() ~= 'yes')
  and (includeFiles:lower() ~= 'on')
  and (includeFiles:lower() ~= 'true')
  and (includeFiles ~= '1')
then
  ngx.log(ngx.INFO, 'Cache Server is not configured for files')
  ngx.header["X-Source"] = "Disk"
  ngx.exec(ngx.var.file_path)
  return
end

local files_cache = require 'files_cache'

local filePath = ngx.var.file_path

local fileContent = files_cache.load(filePath)

if fileContent ~= nil then
  ngx.status = ngx.HTTP_OK
  ngx.header["X-Source"] = "Cache"
  ngx.say(fileContent)
  return ngx.exit(ngx.status)
end

ngx.header["X-Source"] = "Disk"
ngx.exec(ngx.var.file_path)
