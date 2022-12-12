<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit-test

class AttachmentFiles {

    protected static $_testDAO;

    public static function importFiles(int $workspaceId, array $uploadedFiles, Attachment $attachment, string $type): void {

        $workspace = new Workspace($workspaceId);
        $workspacePath = $workspace->getWorkspacePath();

        $dataParts = [];
        foreach ($uploadedFiles as $originalFileName) {

            $dst = "$workspacePath/UnitAttachments/";
            Folder::createPath($dst);
            $attachmentCode = self::randomString();
            $extension = FileExt::get($originalFileName);
            $attachmentFileId = "$type:$attachmentCode.$extension";
            copy("$workspacePath/$originalFileName", "$dst/$attachmentCode.$extension");
            unlink("$workspacePath/$originalFileName");
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

        $filePath = self::getAttachmentFilePath($workspaceId, $attachmentFileId, $attachment);
        if (!file_exists($filePath)) {
            unlink($filePath);
        }
    }


    protected static function testDAO(): TestDAO {

        if (!self::$_testDAO) {
            self::$_testDAO = new TestDAO();
        }

        return self::$_testDAO;
    }


    public static function getAttachmentFilePath(int $workspaceId, string $attachmentFileId, Attachment $attachment): string {

        list($dataType, $fileName) = explode(':', $attachmentFileId);
        if (!in_array($attachmentFileId, $attachment->attachmentFileIds)) {
            throw new HttpError("AttachmentId `$attachmentFileId` not found in attachment `$attachment->attachmentId`", 404);
        }

        $filePath = DATA_DIR . "/ws_$workspaceId/UnitAttachments/$fileName";

        if (!file_exists($filePath)) {
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


    private static function randomString(int $size = 32): string {
        $fileName = '';
        $allowedChars = "ABCDEFGHIJKLOMNOPQRSTUVWXZabcdefghijklmnopqrstuvwxyz0123456789_-";
        while ($size-- > 1) {
            $fileName .= substr($allowedChars, rand(0, strlen($allowedChars) - 1), 1);
        }
        return $fileName;
    }
}