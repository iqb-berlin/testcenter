<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit-test

class AttachmentFiles {
  protected static $_testDAO;

  /** @param string[] $localFilePaths */
  public static function importFiles(int $workspaceId, array $localFilePaths, Attachment $attachment, string $type): void {
    $attachmentDirectory = Workspace::getStorageDirectoryOf($workspaceId)->createSubdirectory('UnitAttachments');

    $dataParts = [];
    foreach ($localFilePaths as $localFilePath) {
      $attachmentCode = Random::string(32, false);
      $extension = FileExt::get(basename($localFilePath));
      $attachmentFileId = "$type:$attachmentCode.$extension";
      Storage::getDriver()->put($attachmentDirectory->createFilePath("$attachmentCode.$extension"), $localFilePath);
      $attachmentFileIds = [...$attachment->attachmentFileIds, $attachmentFileId];
      $dataParts[$attachment->attachmentId] = self::stringifyDataChunk($attachment->variableId, $attachmentFileIds);
    }

    self::testDAO()->updateDataParts(
      $attachment->_testId,
      $attachment->_unitName,
      $dataParts,
      'iqb-standard@1.0',
      TimeStamp::now() * 1000 // unit_data.last_modified normally expects CLIENT-side timestamps in ms
    );
  }

  public static function deleteFile(int $workspaceId, string $attachmentFileId, Attachment $attachment): void {
    $attachmentFileIds = $attachment->attachmentFileIds;
    if (!in_array($attachmentFileId, $attachmentFileIds)) {
      throw new HttpError("File `$attachmentFileId` not found in attachment `$attachment->attachmentId`.", 404);
    }
    array_splice($attachmentFileIds, array_search($attachmentFileId, $attachmentFileIds), 1);

    $dataParts = [];
    $dataParts[$attachment->attachmentId] = self::stringifyDataChunk($attachment->variableId, $attachmentFileIds);

    if (count($attachmentFileIds)) {
      self::testDAO()->updateDataParts(
        $attachment->_testId,
        $attachment->_unitName,
        $dataParts,
        'iqb-standard@1.0',
        TimeStamp::now() * 1000 // unit_data.last_modified normally expects CLIENT-side timestamps in ms
      );

    } else {
      self::testDAO()->deleteAttachmentDataPart($attachment->attachmentId);
    }

    Storage::getDriver()->delete(self::getAttachmentFilePath($workspaceId, $attachmentFileId, $attachment));
  }

  protected static function testDAO(): TestDAO {
    if (!self::$_testDAO) {
      self::$_testDAO = new TestDAO();
    }

    return self::$_testDAO;
  }

  public static function getAttachmentFilePath(int $workspaceId, string $attachmentFileId, Attachment $attachment): StoragePath {
    list($dataType, $fileName) = explode(':', $attachmentFileId);
    if (!in_array($attachmentFileId, $attachment->attachmentFileIds)) {
      throw new HttpError("AttachmentId `$attachmentFileId` not found in attachment `$attachment->attachmentId`", 404);
    }

    $filePath = Workspace::getStorageDirectoryOf($workspaceId)
      ->createSubdirectory('UnitAttachments')
      ->createFilePath($fileName);

    if (!Storage::getDriver()->getFileInfo($filePath)) {
      throw new HttpError("File not found:`$attachment->attachmentId`", 404);
    }

    return $filePath;
  }

  private static function stringifyDataChunk(string $variableId, array $attachmentIds): string {
    return json_encode([
      [
        "id" => $variableId,
        "value" => $attachmentIds,
        "status" => 'VALUE_CHANGED'
      ]
    ]);
  }

}
