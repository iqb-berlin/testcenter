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
        // TODO check if allowed

        $attachmentId = (string) $request->getAttribute('attachmentId');
        $attachment = AttachmentController::adminDAO()->getAttachmentById($attachmentId);

        if (!$attachment) {
            throw new HttpNotFoundException($request, "Attachment not found: `$attachmentId`");
        }

        list($type, $fileName) = explode(':', $attachment['attachmentId']);
        $fullFilename = DATA_DIR . "/ws_{$authToken->getWorkspaceId()}/UnitAttachments/$fileName";
        if (!file_exists($fullFilename)) {
            throw new HttpNotFoundException($request, "$type not found:`$fullFilename`");
        }

        $response->write(file_get_contents($fullFilename));
        return $response->withHeader('Content-Type', FileExt::getMimeType($fullFilename));
    }


    public static function delete(Request $request, Response $response): Response {

        /* @var AuthToken $authToken */
        $authToken = $request->getAttribute('AuthToken');
        // TODO check if allowed

        $attachmentId = (string)$request->getAttribute('attachmentId');
        AttachmentController::adminDAO()->deleteAttachmentById($attachmentId);

        list($type, $fileName) = explode(':', $attachmentId);
        $fullFilename = DATA_DIR . "/ws_{$authToken->getWorkspaceId()}/UnitAttachments/$fileName";
        if (!file_exists($fullFilename)) {
            throw new HttpNotFoundException($request, "$type not found:`$fullFilename`");
        }

        unlink($fullFilename);

        return $response->withStatus(200);
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


    public static function getTargetPage(Request $request, Response $response): Response {

        /* @var AuthToken $authToken */
        $authToken = $request->getAttribute('AuthToken');

        $targetCode = (string) $request->getAttribute('target');
        if (!$targetCode ){

            throw new HttpBadRequestException($request);
        }

        // TODO check if $targetCode is valid target

        $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
        $pdf->SetCreator('IQB-Testcenter');
        $pdf->SetTitle('Attachment-Page');
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

        $pdf->write2DBarcode($targetCode, 'QRCODE,L', 20, 20, 40, 40, $style, 'N');

        $doc = $pdf->Output('/* ignored */', 'S');

        $response->write($doc);
        return $response
            ->withHeader('Content-Type', "application/pdf");


        // TODO check if allowed
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

            $dst = "$workspacePath/UnitAttachments/";
            Folder::createPath($dst);
            $attachmentCode = AttachmentController::randomString();
            $extension = FileExt::get($originalFileName);
            $attachmentId = "$type:$attachmentCode.$extension";
            copy("$workspacePath/$originalFileName", "$dst/$attachmentCode.$extension");
            $dataParts[$attachmentId] = $attachmentId; // TODO implement format
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

        list($uniName, $testId) = explode('@', $target);

        return [
            'unitName' => $uniName,
            'testId' => (int) $testId
        ];
    }


    private static function encodeTarget(int $testId, string $unitName): string {

        return "$unitName@$testId";
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