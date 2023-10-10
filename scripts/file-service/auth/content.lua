local includeFiles = os.getenv("CACHE_SERVICE_INCLUDE_FILES")

if (includeFiles ~= nil)
  and (includeFiles:lower() ~= 'yes')
  and (includeFiles:lower() ~= 'on')
  and (includeFiles:lower() ~= 'true')
  and (includeFiles ~= '1')
then
  ngx.log(ngx.INFO, 'Cache service not configured for files')
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
