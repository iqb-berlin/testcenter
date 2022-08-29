<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit tests !

use JetBrains\PhpStorm\ArrayShape;
use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpNotFoundException;
use Slim\Http\ServerRequest as Request;
use Slim\Http\Response;
use Slim\Psr7\Stream;


class AttachmentController extends Controller {


    public static function get(Request $request, Response $response): Response {

        /* @var AuthToken $authToken */
        $authToken = $request->getAttribute('AuthToken');

        $attachmentId = (string) $request->getAttribute('attachmentId');
        $attachment = AttachmentController::adminDAO()->getAttachmentById($attachmentId);

        if (!$attachment) {
            throw new HttpNotFoundException($request, "Attachment not found: $attachmentId");
        }

        $fullFilename = DATA_DIR . "/ws_{$authToken->getWorkspaceId()}/UnitAttachments/{$attachment['filePath']}";
        if (!file_exists($fullFilename)) {
            throw new HttpNotFoundException($request, "File not found:" . $fullFilename);
        }

        $response->write(file_get_contents($fullFilename));
        return $response->withHeader('Content-Type', FileExt::getMimeType($fullFilename));
    }


    public static function getData(Request $request, Response $response): Response {

        /* @var AuthToken $authToken */
        $authToken = $request->getAttribute('AuthToken');
        $groupNames = [$authToken->getGroup()];

        return $response->withJson(self::adminDAO()->getAttachments($authToken->getWorkspaceId(), $groupNames));
    }


    // TODO api-spec
    public static function getTargetLabel(Request $request, Response $response): Response {

        $targetCode = (string) $request->getAttribute('target');
        if (!$targetCode ){

            throw new HttpBadRequestException($request);
        }
        $target = AttachmentController::decodeTarget($targetCode);

        // TODO check if allowed

        return $response->withJson([
            "label" => AttachmentController::testDAO()->getTestLabel($target['testId'])
        ]);
    }


    // TODO unit-test
    // TODO api-spec
    public static function post(Request $request, Response $response): Response {

        $targetCode = (string) $request->getAttribute('target');
        if (!$targetCode ){

            throw new HttpBadRequestException($request);
        }
        $target = AttachmentController::decodeTarget($targetCode);
        $timeStamp = (int) $request->getParam('timeStamp');
        $mimeType = $request->getParam('mimeType');
        $type = explode('/', $mimeType)[0];

        // TODO check if allowed

        /* @var AuthToken $authToken */
        $authToken = $request->getAttribute('AuthToken');

        $workspace = new Workspace($authToken->getWorkspaceId());
        $workspacePath = $workspace->getWorkspacePath();
        $uploadedFiles = UploadedFilesHandler::handleUploadedFiles($request, 'attachment', $workspacePath);

        $dataParts = [];
        foreach ($uploadedFiles as $originalFileName) {

            $dstSubPath = "test_{$target['testId']}/{$target['unitName']}/$type";
            $dst = "$workspacePath/UnitAttachments/$dstSubPath";
            Folder::createPath($dst);
            $attachmentCode = AttachmentController::randomString();
            $extension = FileExt::get($originalFileName);
            $fileName = "$attachmentCode.$extension";
            copy("$workspacePath/$originalFileName", "$dst/$fileName");
            $dataParts["$type:$attachmentCode.$extension"] = "$dstSubPath/$fileName"; // TODO implement format
            unlink("$workspacePath/$originalFileName");
        }

        self::testDAO()->updateDataParts(
            $target['testId'],
            $target['unitName'],
            $dataParts,
            'itc-attachment-id',
            $timeStamp
        );

        return $response->withStatus(201);
    }


    #[ArrayShape(['unitName' => "string", 'testId' => "int"])]
    private static function decodeTarget(string $target): array {

        // TODO! replace harcoded stuff
        return [
            'unitName' => 'UNIT.SAMPLE',
            'testId' => 4
        ];
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