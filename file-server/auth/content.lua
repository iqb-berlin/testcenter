-- S3 storage: the files are in the bucket, not on disk; the backend redirects there (see location
-- @s3_redirect). First, so that none of the headers below end up next to the backend's.
if os.getenv("STORAGE_DRIVER") == 's3' then
  return ngx.exec('@s3_redirect')
end

-- authenticated resources: keep shared/edge caches (e.g. a CDN) from storing them and
-- serving them on without re-checking the token; set for every path this handler serves
ngx.header["Cache-Control"] = "private"

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
