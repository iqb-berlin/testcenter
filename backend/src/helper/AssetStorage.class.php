<?php
declare(strict_types=1);

class AssetStorage {
  // Subdirectory under DATA_DIR where uploads live on disk.
  private const SUBDIR = 'public/uploaded_assets';

  // URL path nginx serves these under (see file-server/nginx.conf `location /public/`).
  // Kept in sync with SUBDIR by convention only; nginx's alias is the authoritative mapping.
  private const URL_PREFIX = '/public/uploaded_assets/';

  public static function getDir(): string {
    return DATA_DIR . DIRECTORY_SEPARATOR . self::SUBDIR;
  }

  public static function urlFor(string $storedName): string {
    return self::URL_PREFIX . $storedName;
  }
}
