<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

// TODO unit test

use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpException;
use Slim\Http\ServerRequest as Request;
use Slim\Http\UploadedFile;

class UploadedFilesHandler {
  const errorMessages = [
    UPLOAD_ERR_INI_SIZE => [ // php.ini max_file_size
      'message' => 'The uploaded file exceeds the maximum.',
      'code' => 413
    ],
    UPLOAD_ERR_FORM_SIZE => [ // html form MAX_FILE_SIZE
      'message' => 'The uploaded file exceeds the form maximum.',
      'code' => 413
    ],
    UPLOAD_ERR_PARTIAL => [
      'message' => 'The uploaded file was only partially uploaded.',
      'code' => 500
    ],
    UPLOAD_ERR_NO_FILE => [
      'message' => 'No file was uploaded.',
      'code' => 500
    ],
    UPLOAD_ERR_NO_TMP_DIR => [
      'message' => 'Missing a temporary folder.',
      'code' => 500
    ],
    UPLOAD_ERR_CANT_WRITE => [
      'message' => 'Failed to write file to disk.',
      'code' => 500
    ]
  ];

  static function handleUploadedFiles(Request $request, string $fieldName, string $workspacePath): array {
    $allUploadedFiles = $request->getUploadedFiles();

    if (!count($allUploadedFiles)) {
      if (intval($_SERVER['CONTENT_LENGTH']) > 0) {
        throw new HttpException($request, 'Request size exceeds the maximum for post data!', 413);  // max_post_size
      }

      throw new HttpBadRequestException($request, "No Upload File.");
    }

    if (!isset($allUploadedFiles[$fieldName])) {
      throw new HttpBadRequestException($request, "No Upload File in $fieldName");
    }

    $uploadedFiles = $allUploadedFiles[$fieldName];

    if (!is_array($uploadedFiles)) {
      $uploadedFiles = [$uploadedFiles];
    }

    $filesToImport = [];

    foreach ($uploadedFiles as $uploadedFile) {
      /** @var UploadedFile $uploadedFile */

      if ($uploadedFile->getError() !== UPLOAD_ERR_OK) {
        if (isset(UploadedFilesHandler::errorMessages[$uploadedFile->getError()])) {
          $error = UploadedFilesHandler::errorMessages[$uploadedFile->getError()];
        } else {
          throw new HttpException($request, 'Unknown Error');
        }

        throw new HttpException($request, $error['message'], $error['code']);
      }
      $originalFileName = $uploadedFile->getClientFilename();
      $uploadedFile->moveTo($workspacePath . '/' . $originalFileName);
      $filesToImport[] = $originalFileName;
    }

    return $filesToImport;
  }
}
