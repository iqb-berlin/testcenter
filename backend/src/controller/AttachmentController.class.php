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


    public static function get(Request $request, Response $response): Response {

        $attachment = AttachmentController::getRequestedAttachmentById($request);
        $response->write(file_get_contents($attachment['fullFileName']));
        return $response->withHeader('Content-Type', FileExt::getMimeType($attachment['fullFileName']));
    }


    public static function delete(Request $request, Response $response): Response {

        $attachment = AttachmentController::getRequestedAttachmentById($request, false);
        AttachmentController::adminDAO()->deleteAttachmentById($attachment['attachmentId']);
        unlink($attachment['fullFileName']);
        return $response->withStatus(200);
    }


    public static function getData(Request $request, Response $response): Response {

        /* @var AuthToken $authToken */
        $authToken = $request->getAttribute('AuthToken');
        $groupNames = [$authToken->getGroup()];

        return $response->withJson(self::adminDAO()->getAttachments($authToken->getWorkspaceId(), $groupNames));
    }


    public static function getTargetLabel(Request $request, Response $response): Response {

        $attachmentTargetInfo = AttachmentController::getRequestedAttachmentTargetInfo($request);
        return $response->withJson([
            "label" => $attachmentTargetInfo['targetLabel']
        ]);
    }


    public static function getTargetPage(Request $request, Response $response): Response {

        $targetInfo = AttachmentController::getRequestedAttachmentTargetInfo($request);

        $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
        $pdf->SetCreator('IQB-Testcenter');
        $pdf->SetTitle($targetInfo['targetLabel']);
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

        $pdf->write2DBarcode($targetInfo['targetCode'], 'QRCODE,L', 20, 20, 40, 40, $style, 'N');

        $doc = $pdf->Output('/* ignored */', 'S');

        $response->write($doc);
        return $response
            ->withHeader('Content-Type', "application/pdf");
    }


    // TODO unit-test
    // TODO api-spec
    public static function post(Request $request, Response $response): Response {

        $targetCode = (string) $request->getAttribute('target');
        if (!$targetCode){

            throw new HttpBadRequestException($request);
        }
        $target = AttachmentController::decodeTarget($targetCode);
        $timeStamp = (int) $request->getParam('timeStamp');
        $mimeType = $request->getParam('mimeType');
        $type = explode('/', $mimeType)[0];

        // TODO verify target & check if allowed

        /* @var AuthToken $authToken */
        $authToken = $request->getAttribute('AuthToken');

        $workspace = new Workspace($authToken->getWorkspaceId());
        $workspacePath = $workspace->getWorkspacePath();
        $uploadedFiles = UploadedFilesHandler::handleUploadedFiles($request, 'attachment', $workspacePath);

        $dataParts = [];
        foreach ($uploadedFiles as $originalFileName) {

            $dst = "$workspacePath/UnitAttachments/";
            Folder::createPath($dst);
            $attachmentCode = AttachmentController::randomString();
            $extension = FileExt::get($originalFileName);
            $attachmentId = "$type:$attachmentCode";
            copy("$workspacePath/$originalFileName", "$dst/$attachmentCode.$extension");
            $dataParts[$targetCode] = "$attachmentId.$extension"; // TODO implement format
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


    // TODO use proper data-class
    private static function getRequestedAttachmentTargetInfo(Request $request): array {

        /* @var AuthToken $authToken */
        $authToken = $request->getAttribute('AuthToken');

        $targetCode = (string) $request->getAttribute('target');

        if (!$targetCode ){
            throw new HttpBadRequestException($request);
        }

        $target = AttachmentController::decodeTarget($targetCode);
        $targetInfo = AttachmentController::testDAO()->getAttachmentTargetInfo($target['testId']);
        $targetInfo['targetCode'] = $targetCode;

        if (!$targetInfo) {
            throw new HttpBadRequestException($request, "Could not Read Code: `$targetCode`");
        }

        if (!AttachmentController::isGroupAllowed($authToken, $targetInfo['groupName'])) {
            throw new HttpForbiddenException($request, "Access to group `{$targetInfo['groupLabel']} not given.`");
        }

        $displayName = AccessSet::getDisplayName(
            $targetInfo['groupLabel'],
            $targetInfo['loginLabel'],
            $targetInfo['nameSuffix']
        );

        $targetInfo['targetLabel'] = "$displayName: {$targetInfo['testLabel']}";

        return $targetInfo;
    }


    private static function getRequestedAttachmentById(Request $request, bool $fileMustExist = true): array {

        /* @var AuthToken $authToken */
        $authToken = $request->getAttribute('AuthToken');

        $attachmentId = (string) $request->getAttribute('attachmentId');
        $attachment = AttachmentController::adminDAO()->getAttachmentById($attachmentId);

        if (!$attachment) {
            throw new HttpNotFoundException($request, "Attachment not found: `$attachmentId`");
        }

        if (!AttachmentController::isGroupAllowed($authToken, $attachment['groupName'])) {
            throw new HttpForbiddenException($request, "Access to attachment `$attachmentId` not given");
        }

        list($type, $fileName) = explode(':', $attachment['attachmentContent']);
        list($attachment['attachmentType']) = explode(':', $attachment['attachmentId']);
        $attachment['fullFileName'] = DATA_DIR . "/ws_{$authToken->getWorkspaceId()}/UnitAttachments/$fileName";
        if (!file_exists($attachment['fullFileName']) and $fileMustExist) {
            throw new HttpNotFoundException($request, "$type not found:`$fileName`");
        }

        return $attachment;
    }


    #[Pure]
    private static function isGroupAllowed(AuthToken $authToken, string $groupName): bool {

        if ($authToken->getMode() == 'monitor-group') {

            return $authToken->getGroup() == $groupName;
        }

        return false;
    }


    #[ArrayShape(['unitName' => "string", 'testId' => "int", 'variableId' => "string"])]
    private static function decodeTarget(string $target): array {

        $targetPieces = explode(':', $target);

        if (count($targetPieces) != 3) {

            throw new HttpError("Invalid attachment target: `$target`", 400);
        }

        return [
            'testId' => (int) $targetPieces[0],
            'unitName' => $targetPieces[1],
            'variableId' => $targetPieces[2]
        ];
    }


    private static function encodeTarget(int $testId, string $unitName, string $variableId): string {

        return "$unitName:$testId:$variableId";
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