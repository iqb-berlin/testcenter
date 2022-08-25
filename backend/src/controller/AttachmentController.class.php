<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit tests !

use JetBrains\PhpStorm\ArrayShape;
use Slim\Exception\HttpForbiddenException;
use Slim\Exception\HttpNotFoundException;
use Slim\Http\ServerRequest as Request;
use Slim\Http\Response;


class AttachmentController extends Controller {

    public static function getList(Request $request, Response $response): Response {

        /* @var AuthToken $authToken */
        $authToken = $request->getAttribute('AuthToken');
        $groupNames = [$authToken->getGroup()];

        return $response->withJson(self::adminDAO()->getAttachments($authToken->getWorkspaceId(), $groupNames));
    }


    // TODO api-spec
    public static function getTargetLabel(Request $request, Response $response): Response {

        $target = AttachmentController::decodeTarget((string) $request->getAttribute('target'));

        // TODO check if allowed
        return $response->withJson([
            "label" => AttachmentController::testDAO()->getTestLabel($target['testId'])
        ]);
    }


    // TODO unit-test
    // TODO api-spec
    public static function put(Request $request, Response $response): Response {

        $target = $request->getAttribute('target');
        $timeStamp = $request->getParam('timeStamp');

        // TODO check if allowed

        /* @var AuthToken $authToken */
        $authToken = $request->getAttribute('AuthToken');

        $workspace = new Workspace($authToken->getWorkspaceId());
        $workspacePath = $workspace->getWorkspacePath();
        $uploadedFiles = UploadedFilesHandler::handleUploadedFiles($request, 'attachment', $workspacePath);

        $finalFileNames = [];
        foreach ($uploadedFiles as $originalFileName) {

            $dst = $workspace->getOrCreateSubFolderPath("UnitAttachments/{$target['testId']}/{$target['unitName']}");
            $attachmentNumber = count(Folder::getContentsFlat($dst)) + 1;
            $extension = FileExt::get($originalFileName);
            $fileName = "{$target['testId']}_{$target['unitName']}_{$attachmentNumber}.$extension";
            copy("$workspacePath/$originalFileName", "$dst/$fileName");
            $finalFileNames[] = $fileName;
            unlink("$workspacePath/$originalFileName");
        }

        self::testDAO()->updateDataParts(
            $target['testId'],
            $target['unitName'],
            $finalFileNames,
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
}