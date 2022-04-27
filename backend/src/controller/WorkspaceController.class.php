<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

// TODO unit tests !

use Slim\Exception\HttpBadRequestException;
use slim\Exception\HttpInternalServerErrorException;
use Slim\Exception\HttpNotFoundException;
use Slim\Exception\NotFoundException;
use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Http\Stream;


class WorkspaceController extends Controller {

    public static function get(Request $request, Response $response): Response {

        $workspaceId = (int) $request->getAttribute('ws_id');

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');

        return $response->withJson([
            "id" => $workspaceId,
            "name" => self::workspaceDAO()->getWorkspaceName($workspaceId),
            "role" => self::adminDAO()->getWorkspaceRole($authToken->getToken(), $workspaceId)
        ]);
    }


    public static function put(Request $request, Response $response): Response {

        $requestBody = JSON::decode($request->getBody()->getContents());
        if (!isset($requestBody->name)) {
            throw new HttpBadRequestException($request, "New workspace name missing");
        }

        self::superAdminDAO()->createWorkspace($requestBody->name);

        return $response->withStatus(201);
    }


    public static function patch(Request $request, Response $response): Response {

        $requestBody = JSON::decode($request->getBody()->getContents());
        $workspaceId = (int)$request->getAttribute('ws_id');

        if (!isset($requestBody->name) or (!$requestBody->name)) {
            throw new HttpBadRequestException($request, "New name (name) is missing");
        }

        self::superAdminDAO()->setWorkspaceName($workspaceId, $requestBody->name);

        return $response;
    }


    public static function patchUsers(Request $request, Response $response): Response {

        $requestBody = JSON::decode($request->getBody()->getContents());
        $workspaceId = (int)$request->getAttribute('ws_id');

        if (!isset($requestBody->u) or (!count($requestBody->u))) {
            throw new HttpBadRequestException($request, "User-list (u) is missing");
        }

        self::superAdminDAO()->setUserRightsForWorkspace($workspaceId, $requestBody->u);

        return $response->withHeader('Content-type', 'text/plain;charset=UTF-8');
    }


    public static function getUsers(Request $request, Response $response): Response {

        $workspaceId = (int)$request->getAttribute('ws_id');

        return $response->withJson(self::superAdminDAO()->getUsersByWorkspace($workspaceId));
    }


    public static function getResults(Request $request, Response $response): Response {

        $workspaceId = (int)$request->getAttribute('ws_id');
        $results = self::adminDAO()->getResultStats($workspaceId);

        return $response->withJson($results);
    }


    public static function deleteResponses(Request $request, Response $response): Response {

        $workspaceId = (int)$request->getAttribute('ws_id');
        $groups = RequestBodyParser::getRequiredElement($request, 'groups');

        foreach ($groups as $group) {
            self::adminDAO()->deleteResultData($workspaceId, $group);
        }

        BroadcastService::send('system/clean');

        return $response;
    }


    public static function getFile(Request $request, Response $response): Response {

        $workspaceId = $request->getAttribute('ws_id', 0);
        $fileType = $request->getAttribute('type', '[type missing]');
        $filename = $request->getAttribute('filename', '[filename missing]');

        $fullFilename = DATA_DIR . "/ws_$workspaceId/$fileType/$filename";
        if (!file_exists($fullFilename)) {
            throw new HttpNotFoundException($request, "File not found:" . $fullFilename);
        }

        $response->withHeader('Content-Description', 'File Transfer');
        $response->withHeader('Content-Type', ($fileType == 'Resource') ? 'application/octet-stream' : 'text/xml');
        $response->withHeader('Content-Disposition', 'attachment; filename="' . $filename . '"');
        $response->withHeader('Expires', '0');
        $response->withHeader('Cache-Control', 'must-revalidate');
        $response->withHeader('Pragma', 'public');
        $response->withHeader('Content-Length', filesize($fullFilename));

        $fileHandle = fopen($fullFilename, 'rb');

        $fileStream = new Stream($fileHandle);

        return $response->withBody($fileStream);
    }


    public static function postFile(Request $request, Response $response): Response {

        $workspaceId = (int)$request->getAttribute('ws_id');
        $workspace = new Workspace($workspaceId);

        $uploadedFiles = UploadedFilesHandler::handleUploadedFiles($request, 'fileforvo', $workspace->getWorkspacePath());
        $importedFiles = [];

        foreach ($uploadedFiles as $uploadedFile) {
            $importedFiles = array_merge($importedFiles, $workspace->importUnsortedFile($uploadedFile));
        }

        $reports = [];
        $loginsAffected = false;
        $containsErrors = false;
        foreach ($importedFiles as $localPath => /* @var $file File */ $file) {

            if ($file->isValid() and ($file->getType() == 'Testtakers')) {
                /* @var $file XMLFileTesttakers */
                list($deleted, $added) = self::workspaceDAO()->updateLoginSource($workspaceId, $localPath, $file->getAllLogins());
                $file->report('info', "Logins Updated (-$deleted, +$added)");
                $loginsAffected = true;
            }

            if ($file->isValid()) {
                self::workspaceDAO()->storeFileMeta($workspaceId, $file);
            }
            $reports[$localPath] = $file->getValidationReportSorted();
            $containsErrors = ($containsErrors or (isset($reports[$localPath]['error']) and count($reports[$localPath]['error'])));
        }

        if ($loginsAffected) {
            BroadcastService::send('system/clean');
        }

        return $response->withJson($reports)->withStatus($containsErrors ? 207 : 201);
    }


    public static function getFiles(Request $request, Response $response): Response {

        $workspaceId = (int)$request->getAttribute('ws_id');
        $validator = new WorkspaceValidator(new Workspace($workspaceId));
        $validator->validate();
        $fileDigestList = [];
        foreach ($validator->getFiles() as $file) {

            if (!isset($fileDigestList[$file->getType()])) {
                $fileDigestList[$file->getType()] = [];
            }
            $fileDigestList[$file->getType()][] = [
                'name' => $file->getName(),
                'size' => $file->getSize(),
                'modificationTime' => $file->getModificationTime(),
                'type' => $file->getType(),
                'id' => $file->getId(),
                'report' => $file->getValidationReportSorted(),
                'info' => $file->getSpecialInfo()
            ];
        }

        return $response->withJson($fileDigestList);
    }


    public static function deleteFiles(Request $request, Response $response): Response {

        $workspaceId = (int) $request->getAttribute('ws_id');
        $filesToDelete = RequestBodyParser::getRequiredElement($request, 'f');

        $workspace = new Workspace($workspaceId);
        $deletionReport = $workspace->deleteFiles($filesToDelete);

        $loginsAffected = false;

        foreach ($deletionReport['deleted'] as $deletedFile) {

            list($type, $name) = explode('/', $deletedFile);
            if ($type === 'Testtakers') {
                self::workspaceDAO()->deleteLoginSource($workspaceId, $name);
                $loginsAffected = true;
            }
            self::workspaceDAO()->deleteFileMeta($workspaceId, $name);
        }

        if ($loginsAffected) {
            BroadcastService::send('system/clean');
        }

        return $response->withJson($deletionReport)->withStatus(207);
    }


    public static function getReport(Request $request, Response $response): ?Response {

        $workspaceId = (int)$request->getAttribute('ws_id');

        $dataIds = $request->getParam('dataIds', '') === ''
            ? []
            : explode(',', $request->getParam('dataIds', ''));

        try {
            $reportType = new ReportType($request->getAttribute('type'));
        } catch (InvalidArgumentException $exception) {
            throw new HttpNotFoundException($request, "Report type '{$request->getAttribute('type')}' not found.");
        }

        $reportFormat = $request->getHeaderLine('Accept') == 'text/csv'
            ? new ReportFormat(ReportFormat::CSV)
            : new ReportFormat(ReportFormat::JSON);

        $report = new Report($workspaceId, $dataIds, $reportType, $reportFormat);

        if ($reportType->getValue() == ReportType::SYSTEM_CHECK) {
            $report->setSysChecksFolderInstance(new SysChecksFolder($workspaceId));
        } else {
            $report->setAdminDAOInstance(self::adminDAO());
        }

        if (!empty($dataIds) and $report->generate()) {

            switch ($reportFormat->getValue()) {

                case ReportFormat::CSV:

                    $response->getBody()->write($report->getCsvReportData());
                    $response = $response->withHeader('Content-Type', 'text/csv;charset=UTF-8');
                    break;


                case ReportFormat::JSON:

                    $response = $response->withJson($report->getReportData());
                    break;


                default:

                    $response = $response->withHeader('Content-Type', 'application/json');  // @codeCoverageIgnore
            }

        } else {

            $response = $reportFormat->getValue() === ReportFormat::CSV
                ? $response->withHeader('Content-type', 'text/csv;charset=UTF-8')
                : $response->withHeader('Content-Type', 'application/json');
        }

        return $response;
    }


    public static function getSysCheckReportsOverview(Request $request, Response $response): Response {

        $workspaceId = (int)$request->getAttribute('ws_id');

        $sysChecksFolder = new SysChecksFolder($workspaceId);
        $reports = $sysChecksFolder->getSysCheckReportList();

        return $response->withJson($reports);
    }


    public static function deleteSysCheckReports(Request $request, Response $response): Response {

        $workspaceId = (int)$request->getAttribute('ws_id');
        $checkIds = RequestBodyParser::getElementWithDefault($request, 'checkIds', []);

        $sysChecksFolder = new SysChecksFolder($workspaceId);
        $fileDeletionReport = $sysChecksFolder->deleteSysCheckReports($checkIds);

        return $response->withJson($fileDeletionReport)->withStatus(207);
    }


    public static function getSysCheck(Request $request, Response $response): Response {

        $workspaceId = (int)$request->getAttribute('ws_id');
        $sysCheckName = $request->getAttribute('sys-check_name');

        $workspaceController = new Workspace($workspaceId);
        /* @var XMLFileSysCheck $xmlFile */
        $xmlFile = $workspaceController->findFileById('SysCheck', $sysCheckName);

        return $response->withJson(new SysCheck([
            'name' => $xmlFile->getId(),
            'label' => $xmlFile->getLabel(),
            'canSave' => $xmlFile->hasSaveKey(),
            'hasUnit' => $xmlFile->hasUnit(),
            'questions' => $xmlFile->getQuestions(),
            'customTexts' => (object)$xmlFile->getCustomTexts(),
            'skipNetwork' => $xmlFile->getSkipNetwork(),
            'downloadSpeed' => $xmlFile->getSpeedtestDownloadParams(),
            'uploadSpeed' => $xmlFile->getSpeedtestUploadParams(),
            'workspaceId' => $workspaceId
        ]));
    }

    public static function getSysCheckUnitAndPLayer(Request $request, Response $response): Response {

        $workspaceId = (int)$request->getAttribute('ws_id');
        $sysCheckName = $request->getAttribute('sys-check_name');

        $validator = new WorkspaceValidator(new Workspace($workspaceId));

        /* @var XMLFileSysCheck $sysCheck */
        $sysCheck = $validator->getSysCheck($sysCheckName);
        if (($sysCheck == null)) {
            throw new NotFoundException($request, $response);
        }

        if (!$sysCheck->hasUnit()) {
            return $response->withJson([
                'player_id' => '',
                'def' => '',
                'player' => ''
            ]);
        }

        $sysCheck->crossValidate($validator);
        if (!$sysCheck->isValid()) {

            throw new HttpInternalServerErrorException($request, 'SysCheck is invalid');
        }

        $unit = $validator->getUnit($sysCheck->getUnitId());
        $unit->crossValidate($validator);
        if (!$unit->isValid()) {

            throw new HttpInternalServerErrorException($request, 'Unit is invalid');
        }

        $player = $unit->getPlayerIfExists($validator);
        if (!$player or !$player->isValid()) {

            throw new HttpInternalServerErrorException($request, 'Player is invalid');
        }

        return $response->withJson([
            'player_id' => $unit->getPlayerId(),
            'def' => $unit->getContent($validator),
            'player' => $player->getContent()
        ]);
    }

    public static function putSysCheckReport(Request $request, Response $response): Response {

        $workspaceId = (int)$request->getAttribute('ws_id');
        $sysCheckName = $request->getAttribute('sys-check_name');
        $report = new SysCheckReport(JSON::decode($request->getBody()->getContents()));

        $sysChecksFolder = new SysChecksFolder($workspaceId);

        /* @var XMLFileSysCheck $xmlFile */
        $xmlFile = $sysChecksFolder->findFileById('SysCheck', $sysCheckName);

        if (strlen((string) $report->keyPhrase) <= 0) {

            throw new HttpBadRequestException($request, "No key `$report->keyPhrase`");
        }

        if (strtoupper((string) $report->keyPhrase) !== strtoupper($xmlFile->getSaveKey())) {

            throw new HttpError("Wrong key `$report->keyPhrase`", 400);
        }

        $report->checkId = $sysCheckName;
        $report->checkLabel = $xmlFile->getLabel();

        $sysChecksFolder->saveSysCheckReport($report);

        return $response->withStatus(201);
    }

}
