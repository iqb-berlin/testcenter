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
      return $response->withJson(['error' => 'No file uploaded'])->withStatus(400);
    }

    $file = $uploadedFiles['file'];
    $validationResult = self::validateUpload($file);
    if (isset($validationResult['error'])) {
      return $response->withJson($validationResult)->withStatus(400);
    }

    $originalName = $validationResult['originalName'];
    $extension = $validationResult['extension'];
    $storedName = 'asset_' . Random::generateRandomId() . '.' . $extension;

    $uploadDir = AssetStorage::dir();
    if (!is_dir($uploadDir)) {
      mkdir($uploadDir, 0755, true);
    }
    $file->moveTo($uploadDir . DIRECTORY_SEPARATOR . $storedName);

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
      return $response->withJson(['error' => 'Asset not found'])->withStatus(404);
    }

    self::deleteStoredFile($asset['stored_name']);

    self::assetDAO()->deleteAsset((int) $args['id']);

    return $response->withJson(['status' => 'deleted']);
  }

  /**
   * @return array{originalName: string, extension: string, mimeType: string}|array{error: string, mime?: string}
   */
  private static function validateUpload(UploadedFileInterface $file): array {
    if ($file->getError() !== UPLOAD_ERR_OK) {
      return ['error' => 'Upload failed'];
    }

    if ($file->getSize() > self::MAX_UPLOAD_SIZE) {
      return ['error' => 'File too large (max 2MB)'];
    }

    $tmpFilePath = $file->getStream()->getMetadata('uri');
    $mimeType = mime_content_type($tmpFilePath);
    if (!in_array($mimeType, self::ALLOWED_MIME_TYPES, true)) {
      return ['error' => 'Invalid file type', 'mime' => $mimeType];
    }

    if (getimagesize($tmpFilePath) === false) {
      return ['error' => 'File is not a valid image'];
    }

    $originalName = $file->getClientFilename();
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    if (!in_array($extension, self::ALLOWED_EXTENSIONS, true)) {
      return ['error' => 'Invalid file extension'];
    }

    return [
      'originalName' => $originalName,
      'extension' => $extension,
      'mimeType' => $mimeType
    ];
  }

  private static function deleteStoredFile(string $storedName): void {
    $filePath = AssetStorage::dir() . DIRECTORY_SEPARATOR . $storedName;
    if (file_exists($filePath)) {
      unlink($filePath);
    }
  }
}
