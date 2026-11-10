<?php
declare(strict_types=1);

use Slim\Http\Response;

class FileResponse {
  /**
   * Streams the file at $path as the body of $response; a missing file is a 404. The caller
   * must ensure the path is legitimate (e.g. via Workspace::getFilePath).
   * Passing $downloadName adds a Content-Disposition attachment header.
   *
   * Cache-Control: private keeps shared/edge caches (e.g. a CDN) from storing these
   * authenticated responses and serving them without re-checking authorization; the
   * browser may still cache them per user.
   */
  public static function stream(
    Response $response,
    StoragePath $path,
    ?string  $downloadName = null,
    ?string  $contentType = null
  ): Response {
    $fileInfo = Storage::getDriver()->getFileInfo($path);
    if (!$fileInfo) {
      throw new HttpError("File not found: `$path`", 404);
    }

    $response = $response
      ->withHeader('Content-Type', $contentType ?? FileExt::getMimeType($path->name))
      ->withHeader('Content-Length', (string) $fileInfo->size)
      ->withHeader('Cache-Control', 'private')
      ->withBody(Storage::getDriver()->getStream($path));

    if ($downloadName !== null) {
      $response = $response->withHeader('Content-Disposition', 'attachment; filename="' . $downloadName . '"');
    }

    return $response;
  }
}
