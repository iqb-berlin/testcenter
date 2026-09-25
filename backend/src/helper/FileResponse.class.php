<?php
declare(strict_types=1);

use Slim\Http\Response;
use Slim\Psr7\Stream;

class FileResponse {
  /**
   * Streams the file at $absolutePath as the body of $response. The caller must ensure
   * the path is legitimate and contained (e.g. via Workspace::getFilePath).
   * Passing $downloadName adds a Content-Disposition attachment header.
   */
  public static function stream(
    Response $response,
    string   $absolutePath,
    ?string  $downloadName = null,
    ?string  $contentType = null
  ): Response {
    $response = $response
      ->withHeader('Content-Type', $contentType ?? FileExt::getMimeType($absolutePath))
      ->withHeader('Content-Length', (string) filesize($absolutePath))
      ->withBody(new Stream(fopen($absolutePath, 'rb')));

    if ($downloadName !== null) {
      $response = $response->withHeader('Content-Disposition', 'attachment; filename="' . $downloadName . '"');
    }

    return $response;
  }
}
