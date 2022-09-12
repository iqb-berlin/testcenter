<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit tests !
// TODO api-specs

use JetBrains\PhpStorm\ArrayShape;
use JetBrains\PhpStorm\Pure;
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

        $attachment = AttachmentController::getRequestedAttachmentById($request);
        AttachmentController::adminDAO()->deleteAttachmentById($attachment->attachmentId);
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

        error_log("!!!");

        $attachment = AttachmentController::getRequestedAttachmentById($request);

        $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
        $pdf->SetCreator('IQB-Testcenter');
        $pdf->SetTitle("$attachment->personLabel: $attachment->testLabel");
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        $pdf->AddPage();

        $style = array(
            'border' => 0,
            'vpadding' => 0,
            'hpadding' => 0,
            'fgcolor' => array(0,0,0),
            'bgcolor' => false, //array(255,255,255)
            'module_width' => 1, // width of a single module in points
            'module_height' => 1 // height of a single module in points
        );

        $pdf->write2DBarcode($attachment->attachmentId, 'QRCODE,L', 20, 20, 40, 40, $style, 'N');

        $doc = $pdf->Output('/* ignored */', 'S');

        $response->write($doc);
        return $response
            ->withHeader('Content-Type', "application/pdf");
    }


    // TODO unit-test
    // TODO api-spec
    public static function postFile(Request $request, Response $response): Response {

        $attachmentId = (string) $request->getAttribute('attachmentId');
        if (!$attachmentId){

            throw new HttpBadRequestException($request, "AttachmentId Missing!");
        }
        $target = AttachmentController::decodeAttachmentId($attachmentId);
        $timeStamp = (int) $request->getParam('timeStamp');
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
            $dataParts[$attachmentId] = AttachmentController::stringifyDataChunk($target['variableId'], $attachmentFileIds);
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


    private static function getRequestedAttachmentById(Request $request): Attachment {

        $authToken = self::authToken($request);

        $attachmentId = (string) $request->getAttribute('attachmentId');
        $attachment = AttachmentController::adminDAO()->getAttachmentById($attachmentId);

        if (!AttachmentController::isGroupAllowed($authToken, $attachment->groupName)) {
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


    #[Pure]
    private static function isGroupAllowed(AuthToken $authToken, string $groupName): bool {

        if ($authToken->getMode() == 'monitor-group') {

            return $authToken->getGroup() == $groupName;
        }

        return false;
    }


    // TODO move to better place
    #[ArrayShape(['unitName' => "string", 'testId' => "int", 'variableId' => "string"])]
    static function decodeAttachmentId(string $attachmentId): array {

        $idPieces = explode(':', $attachmentId);

        if (count($idPieces) != 3) {

            throw new HttpError("Invalid attachment attachmentId: `$attachmentId`", 400);
        }

        return [
            'testId' => (int) $idPieces[0],
            'unitName' => $idPieces[1],
            'variableId' => $idPieces[2]
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