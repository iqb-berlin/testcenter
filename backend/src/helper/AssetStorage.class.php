<?php
declare(strict_types=1);

class AssetStorage {
  // The backend route that delivers the assets. The file-server passes this path on to the backend; its nginx
  // configs (file-server/nginx.conf, Helm's configmap-nginx.yaml) name it too and must be changed with it.
  public const URL_PREFIX = 'public/uploaded_assets/';

  public static function getPath(string $storedName): StoragePath {
    return StorageDirectory::root()->createSubdirectory('public', 'uploaded_assets')->createFilePath($storedName);
  }

  public static function urlFor(string $storedName): string {
    return self::URL_PREFIX . $storedName;
  }
}
