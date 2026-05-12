<?php

declare(strict_types=1);

use Slim\Http\Response;
use Slim\Http\ServerRequest as Request;

class AssetController extends Controller {

  public function upload(Request $request, Response $response) {
    $uploadedFiles = $request->getUploadedFiles();

    if (!isset($uploadedFiles['file'])) {
      $response->getBody()->write(json_encode(["error" => "No file uploaded"]));
      return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
    }

    $file = $uploadedFiles['file'];

    $validationResult = $this->validateUpload($file);
    if (isset($result['error'])) {
      $response->getBody()->write(json_encode($validationResult));
      return $response->withStatus(400)
        ->withHeader('Content-Type', 'application/json');
    }
    $originalName = $validationResult['originalName'];
    $extension = $validationResult['extension'];

    // Generate safe filename
    $filename = uniqid('asset_', true) . '.' . $extension;

    if (!is_dir(PUBLIC_ASSET_DIR)) {
      mkdir(PUBLIC_ASSET_DIR, 0755, true);
    }
    $file->moveTo(PUBLIC_ASSET_DIR . DIRECTORY_SEPARATOR . $filename);

    $dao = new DAO();
    $id = $dao->insert("
        INSERT INTO assets (original_name, stored_name)
        VALUES (:original_name, :stored_name)",
      [
        ':original_name' => $originalName,
        ':stored_name' => $filename
      ]
    );

    $responseData = [
      "id" => $id,
      "originalName" => $originalName,
      "storedName" => $filename,
      "url" => FileService::urlFor($filename)
    ];
    $response->getBody()->write(json_encode($responseData));
    return $response->withHeader('Content-Type', 'application/json');
  }

  private function validateUpload($file): ?array {
    // Upload error
    if ($file->getError() !== UPLOAD_ERR_OK) {
      return ["error" => "Upload failed"];
    }

    // File size
    $maxSize = 2 * 1024 * 1024;
    if ($file->getSize() > $maxSize) {
      return ["error" => "File too large (max 2MB)"];
    }

    // MIME type
    $tmpFilePath = $file->getStream()->getMetadata('uri');
    $mimeType = mime_content_type($tmpFilePath);
    $allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!in_array($mimeType, $allowedMimeTypes)) {
      return [
        "error" => "Invalid file type",
        "mime" => $mimeType
      ];
    }

    // Real image check
    if (getimagesize($tmpFilePath) === false) {
      return ["error" => "File is not a valid image"];
    }

    // Extension
    $originalName = $file->getClientFilename();
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $allowedExtensions = ['png', 'jpg', 'jpeg', 'webp'];
    if (!in_array($extension, $allowedExtensions)) {
      return ["error" => "Invalid file extension"];
    }

    return [
      "originalName" => $originalName,
      "extension" => $extension,
      "mimeType" => $mimeType
    ];
  }

  public function list(Request $request, Response $response): Response {
    $dao = new DAO();
    $rows = $dao->_(
      "SELECT id, original_name AS originalName, stored_name AS storedName, created_at AS createdAt
           FROM assets
           ORDER BY created_at DESC",
      [],
      true
    );

    $assets = array_map(static function (array $row): array {
      $row['url'] = FileService::urlFor($row['storedName']);
      return $row;
    }, $rows);

    $response->getBody()->write(json_encode($assets));
    return $response
      ->withHeader('Content-Type', 'application/json')
      ->withStatus(200);
  }

  public function delete(Request $request, Response $response, array $args): Response {
    $dao = new DAO();

    $id = $args['id'];
    $asset = $dao->_(
      "SELECT * FROM assets WHERE id = :id",
      [':id' => $id]
    );

    if (!$asset) {
      $response->getBody()->write(json_encode([
        "error" => "Asset not found"
      ]));
      return $response->withStatus(404)
        ->withHeader('Content-Type', 'application/json');
    }

    $filePath = PUBLIC_ASSET_DIR . DIRECTORY_SEPARATOR . $asset['stored_name'];
    if (file_exists($filePath)) {
      unlink($filePath);
    }

    $dao->_(
      "DELETE FROM assets WHERE id = :id",
      [':id' => $id]
    );

    $response->getBody()->write(json_encode([
      "status" => "deleted"
    ]));
    return $response->withHeader('Content-Type', 'application/json');
  }
}