<?php
declare(strict_types=1);

class AssetStorage {
  // URL path nginx serves these under (see file-server/nginx.conf `location /public/`).
  // Kept in sync with the storage directory by convention only; nginx's alias is the authoritative mapping.
  private const URL_PREFIX = 'public/uploaded_assets/';

  public static function getPath(string $storedName): StoragePath {
    return StorageDirectory::root()->createSubdirectory('public', 'uploaded_assets')->createFilePath($storedName);
  }

  public static function urlFor(string $storedName): string {
    return self::URL_PREFIX . $storedName;
  }
}
