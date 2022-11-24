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
        $filePath = AttachmentFiles::getAttachmentFilePath(
            self::authToken($request)->getWorkspaceId(),
            (string) $request->getAttribute('fileId'),
            $attachment
        );

        $response->write(file_get_contents($filePath));

        return $response->withHeader('Content-Type', FileExt::getMimeType($filePath));
    }


    public static function getList(Request $request, Response $response): Response {

        $authToken = self::authToken($request);
        $groupNames = [$authToken->getGroup()];

        return $response->withJson(self::adminDAO()->getAttachments($authToken->getWorkspaceId(), $groupNames));
    }


    public static function deleteFile(Request $request, Response $response): Response {

        AttachmentFiles::deleteFile(
            self::authToken($request)->getWorkspaceId(),
            (string) $request->getAttribute('fileId'),
            self::getRequestedAttachmentById($request)
        );

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


    public static function getAttachmentsPages(Request $request, Response $response): Response {

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

        $body = $request->getBody()->getContents();

        $type = $request->getParam('type');
        if (!$type) {

            throw new HttpBadRequestException($request, "No type given");
        }

        $workspace = new Workspace(self::authToken($request)->getWorkspaceId());
        $workspacePath = $workspace->getWorkspacePath();
        $attachment = AttachmentController::getRequestedAttachmentById($request);

        $uploadedFiles = UploadedFilesHandler::handleUploadedFiles($request, 'attachment', $workspacePath);

        AttachmentFiles::importFiles(
            $workspace->getId(),
            $uploadedFiles,
            $attachment,
            $type
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

    private static function isGroupAllowed(AuthToken $authToken, string $groupName): bool {

        if ($authToken->getMode() == 'monitor-group') {

            return $authToken->getGroup() == $groupName;
        }

        return false;
    }
}