<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class Folder {
  /** returns filepath
   * stream save (PHP's function glob is not)
   * **/
  static function glob(string $dir, string $filePattern = null, $reverse = false): array {
    if (!file_exists($dir) or !is_dir($dir)) {
      return [];
    }

    $files = scandir($dir, $reverse ? 1 : 0);
    $found = [];

    foreach ($files as $filename) {
      if (in_array($filename, ['.', '..'])) {
        continue;
      }

      if (!$filePattern or fnmatch($filePattern, $filename)) {
        $found[] = "$dir/$filename";
      }
    }

    return $found;
  }

  static function getContentsRecursive(string $path): array {
    $list = [];

    if ($handle = opendir($path)) {
      while (false !== ($entry = readdir($handle))) {
        if ($entry != "." && $entry != "..") {
          if (is_file("$path/$entry")) {
            $list[] = $entry;
          }
          if (is_dir("$path/$entry")) {
            $list[$entry] = Folder::getContentsRecursive("$path/$entry");
          }
        }
      }
      closedir($handle);
    }

    return $list;
  }

  static function getContentsFlat(string $path, $localPath = ''): array {
    $list = [];

    if ($handle = opendir($path)) {
      while (false !== ($entry = readdir($handle))) {
        if ($entry != "." && $entry != "..") {
          $localPathEntry = $localPath ? "$localPath/$entry" : $entry;
          if (is_file("$path/$entry")) {
            $list[] = $localPathEntry;
          }
          if (is_dir("$path/$entry")) {
            $list = array_merge($list, Folder::getContentsFlat("$path/$entry", $localPathEntry));
          }
        }
      }
      closedir($handle);
    }

    return $list;
  }

  // TODO unit-test
  static function deleteContentsRecursive(string $path): void {
    if (!is_dir($path)) {
      return;
    }

    foreach (new DirectoryIterator($path) as $entry) {
      if ($entry->isDot()) continue; // skip . and ..

      if ($entry->isLink()) continue;

      if ($entry->isFile()) {
        if (!@unlink($entry->getPathname())) {
          throw new Exception("Could not delete `$entry`.. permission denied");
        }

      } else if ($entry->isDir()) {
        Folder::deleteContentsRecursive($entry->getPathname());
        rmdir($entry->getPathname());
      }
    }
  }


  // TODO unit-test

  /**
   * creates missing subdirectories for a missing path,
   * for example: let /var/www/html/vo_data exist
   * and $filePath be /var/www/html/vo_data/ws_5/Testtakers
   * this functions creates ws_5 and ws_5/Testtakers in /var/www/html/vo_data
   * Note: dont' use paths containing filenames!
   *
   * difference to getOrCreateSubFolderPath -> can also create workspace-dir itself as well
   * as sub-sub dirs like SysCheck/reports
   *
   * @param $dirPath - a full path
   * @return string - the path, again
   * @throws Exception
   */
  static function createPath(string $dirPath): string {
    $pathParts = parse_url($dirPath);
    return array_reduce(explode('/', $pathParts['path']), function($agg, $item) {
      $agg .= "$item/";
      if (file_exists($agg) and !is_dir($agg)) {
        throw new Exception("$agg is not a directory, but should be!");
      }
      if (!file_exists($agg)) {
        mkdir($agg);
      }
      return $agg;
    }, isset($pathParts['scheme']) ? "{$pathParts['scheme']}://{$pathParts['host']}" : '');

  }
}
