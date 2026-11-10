<?php

declare(strict_types=1);

use Slim\Http\Response;
use Slim\Http\ServerRequest as Request;
use Psr\Http\Message\UploadedFileInterface;

class AssetController extends Controller {
  private const MAX_UPLOAD_SIZE = 2 * 1024 * 1024;
  private const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
  private const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];

  public static function list(Request $request, Response $response): Response {
    $rows = self::assetDAO()->getAllAssets();
    $assets = array_map(static fn(array $row): array => [
      'id' => $row['id'],
      'originalName' => $row['original_name'],
      'storedName' => $row['stored_name'],
      'createdAt' => $row['created_at'],
      'url' => AssetStorage::urlFor($row['stored_name'])
    ], $rows);

    return $response->withJson($assets);
  }

  public static function upload(Request $request, Response $response): Response {
    $uploadedFiles = $request->getUploadedFiles();

    if (!isset($uploadedFiles['file'])) {
      throw new HttpError('No file uploaded', 400);
    }

    $file = $uploadedFiles['file'];
    if ($file->getError() !== UPLOAD_ERR_OK) {
      throw new HttpError('Upload failed', 400);
    }

    $localPath = tempnam(sys_get_temp_dir(), 'asset-upload-');
    try {
      $file->moveTo($localPath);
      $validationResult = self::validateUpload($file, $localPath);

      $originalName = $validationResult['originalName'];
      $extension = $validationResult['extension'];
      $storedName = 'asset_' . Random::generateRandomId() . '.' . $extension;

      Storage::getDriver()->put(AssetStorage::getPath($storedName), $localPath);
    } finally {
      unlink($localPath);
    }

    try {
      $replacement = self::assetDAO()->replaceAssetByOriginalName($originalName, $storedName);
    } catch (Throwable $exception) {
      self::deleteStoredFile($storedName);
      throw $exception;
    }

    if ($replacement['previousStoredName']) {
      self::deleteStoredFile($replacement['previousStoredName']);
    }

    return $response->withJson([
      'id' => $replacement['id'],
      'originalName' => $originalName,
      'storedName' => $storedName,
      'url' => AssetStorage::urlFor($storedName)
    ]);
  }

  public static function delete(Request $request, Response $response, array $args): Response {
    $asset = self::assetDAO()->getAsset((int) $args['id']);

    if (!$asset) {
      throw new HttpError("Asset `{$args['id']}` not found", 404);
    }

    self::deleteStoredFile($asset['stored_name']);

    self::assetDAO()->deleteAsset((int) $args['id']);

    return $response->withJson(['status' => 'deleted']);
  }

  /**
   * @return array{originalName: string, extension: string, mimeType: string}
   */
  private static function validateUpload(UploadedFileInterface $file, string $localPath): array {
    if ($file->getSize() > self::MAX_UPLOAD_SIZE) {
      throw new HttpError('File too large (max 2MB)', 400);
    }

    $mimeType = mime_content_type($localPath);
    if (!in_array($mimeType, self::ALLOWED_MIME_TYPES, true)) {
      throw new HttpError("Invalid file type: `$mimeType`", 400);
    }

    if (getimagesize($localPath) === false) {
      throw new HttpError('File is not a valid image', 400);
    }

    $originalName = $file->getClientFilename();
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    if (!in_array($extension, self::ALLOWED_EXTENSIONS, true)) {
      throw new HttpError("Invalid file extension: `$extension`", 400);
    }

    return [
      'originalName' => $originalName,
      'extension' => $extension,
      'mimeType' => $mimeType
    ];
  }

  private static function deleteStoredFile(string $storedName): void {
    Storage::getDriver()->delete(AssetStorage::getPath($storedName));
  }
}
