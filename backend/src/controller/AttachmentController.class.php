<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit tests !
// TODO api-specs

use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpForbiddenException;
use Slim\Exception\HttpNotFoundException;
use Slim\Http\ServerRequest as Request;
use Slim\Http\Response;


class AttachmentController extends Controller {


    public static function getFile(Request $request, Response $response): Response {

        $attachment = AttachmentController::getRequestedAttachmentById($request);
        $filePath = AttachmentController::getAttachmentFilePath($request, $attachment);
        if (!file_exists($filePath)) {
            throw new HttpNotFoundException($request, "File not found:`$attachment->attachmentId`");
        }
        $response->write(file_get_contents($filePath));

        return $response->withHeader('Content-Type', FileExt::getMimeType($filePath));
    }


    public static function getList(Request $request, Response $response): Response {

        $authToken = self::authToken($request);
        $groupNames = [$authToken->getGroup()];

        return $response->withJson(self::adminDAO()->getAttachments($authToken->getWorkspaceId(), $groupNames));
    }


    public static function deleteFile(Request $request, Response $response): Response {

        $attachmentFileId = (string) $request->getAttribute('fileId');
        $attachment = AttachmentController::getRequestedAttachmentById($request);

        $attachmentFileIds = $attachment->attachmentFileIds;
        if (!in_array($attachmentFileId, $attachmentFileIds)) {
            throw new HttpNotFoundException($request, "File `$attachmentFileId` not found in attachment `$attachment->attachmentId`.");
        }
        array_splice($attachmentFileIds, array_search($attachmentFileId, $attachmentFileIds), 1);

        $dataParts = [];
        $dataParts[$attachment->attachmentId] = AttachmentController::stringifyDataChunk($attachment->variableId, $attachmentFileIds);

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

        $filePath = AttachmentController::getAttachmentFilePath($request, $attachment);
        if (!file_exists($filePath)) {
            unlink($filePath);
        }

        return $response->withStatus(200);
    }


    public static function getData(Request $request, Response $response): Response {

        $attachment = AttachmentController::getRequestedAttachmentById($request);
        return $response->withJson($attachment);
    }


    public static function getAttachmentPage(Request $request, Response $response): Response {

        $attachment = AttachmentController::getRequestedAttachmentById($request);
        $pdfString = AttachmentTemplate::render($attachment->_label, $attachment);

        $response->write($pdfString);
        return $response
            ->withHeader('Content-Type', "application/pdf")
            ->withHeader('Content-Disposition', "attachment; filename=pages.zip")
            ->withHeader('Content-length', strlen($pdfString));
    }


    public static function getAttaachmentsPages(Request $request, Response $response): Response {

        $authToken = self::authToken($request);
        $groupNames = [$authToken->getGroup()];

        $attachments = self::adminDAO()->getAttachments($authToken->getWorkspaceId(), $groupNames);
        $pdfString = AttachmentTemplate::render(implode(', ', $groupNames), ...$attachments);

        $response->write($pdfString);
        return $response
            ->withHeader('Content-Type', "application/pdf")
            ->withHeader('Content-Disposition', "attachment; filename=pages.pdf")
            ->withHeader('Content-length', strlen($pdfString));
    }


    // TODO unit-test
    // TODO api-spec
    public static function postFile(Request $request, Response $response): Response {

        $attachmentId = (string) $request->getAttribute('attachmentId');
        if (!$attachmentId){

            throw new HttpBadRequestException($request, "AttachmentId Missing!");
        }

        $mimeType = $request->getParam('mimeType');
        $type = explode('/', $mimeType)[0];
        $authToken = self::authToken($request);

        $attachment = AttachmentController::getRequestedAttachmentById($request);

        $workspace = new Workspace($authToken->getWorkspaceId());
        $workspacePath = $workspace->getWorkspacePath();
        $uploadedFiles = UploadedFilesHandler::handleUploadedFiles($request, 'attachment', $workspacePath);

        $dataParts = [];
        foreach ($uploadedFiles as $originalFileName) {

            $dst = "$workspacePath/UnitAttachments/";
            Folder::createPath($dst);
            $attachmentCode = AttachmentController::randomString();
            $extension = FileExt::get($originalFileName);
            $attachmentFileId = "$type:$attachmentCode.$extension";
            copy("$workspacePath/$originalFileName", "$dst/$attachmentCode.$extension");
            unlink("$workspacePath/$originalFileName");
            $attachmentFileIds = [...$attachment->attachmentFileIds, $attachmentFileId];
            $dataParts[$attachmentId] = AttachmentController::stringifyDataChunk($attachment->variableId, $attachmentFileIds);
        }

        self::testDAO()->updateDataParts(
            $attachment->_testId,
            $attachment->_unitName,
            $dataParts,
            'iqb-standard@1.0',
            TimeStamp::now() * 1000 // unit_data.last_modified normally expects CLIENT-side timestamps in ms
        );

        return $response->withStatus(201);
    }


    private static function getRequestedAttachmentById(Request $request): Attachment {

        $authToken = self::authToken($request);

        $attachmentId = (string) $request->getAttribute('attachmentId');
        $attachment = AttachmentController::adminDAO()->getAttachmentById($attachmentId);

        if (!AttachmentController::isGroupAllowed($authToken, $attachment->_groupName)) {
            throw new HttpForbiddenException($request, "Access to attachment `$attachmentId` not given");
        }

        return $attachment;
    }


    private static function getAttachmentFilePath(Request $request, Attachment $attachment): string {

        $authToken = self::authToken($request);
        $attachmentFileId = (string) $request->getAttribute('fileId');
        list($dataType, $fileName) = explode(':', $attachmentFileId);
        if (!in_array($attachmentFileId, $attachment->attachmentFileIds)) {
            throw new HttpNotFoundException($request,"AttachmentId `$attachmentFileId` not found in attachment `$attachment->attachmentId`");
        }

        return DATA_DIR . "/ws_{$authToken->getWorkspaceId()}/UnitAttachments/$fileName";
    }


    private static function isGroupAllowed(AuthToken $authToken, string $groupName): bool {

        if ($authToken->getMode() == 'monitor-group') {

            return $authToken->getGroup() == $groupName;
        }

        return false;
    }


    private static function randomString(int $size = 32): string {
        $fileName = '';
        $allowedChars = "ABCDEFGHIJKLOMNOPQRSTUVWXZabcdefghijklmnopqrstuvwxyz0123456789_-";
        while ($size-- > 1) {
            $fileName .= substr($allowedChars, rand(0, strlen($allowedChars) - 1), 1);
        }
        return $fileName;
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