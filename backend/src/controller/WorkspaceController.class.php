<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

// TODO unit tests !

use Slim\Exception\HttpBadRequestException;
use slim\Exception\HttpInternalServerErrorException;
use Slim\Exception\HttpNotFoundException;
use Slim\Http\ServerRequest as Request;
use Slim\Http\Response;
use Slim\Psr7\Stream;

class WorkspaceController extends Controller {
  /**
   * @deprecated
   */
  public static function get(Request $request, Response $response): Response {
    $workspaceId = (int) $request->getAttribute('ws_id');

    /* @var $authToken AuthToken */
    $authToken = $request->getAttribute('AuthToken');

    return $response->withJson([
      "id" => $workspaceId,
      "name" => self::workspaceDAO($workspaceId)->getWorkspaceName(),
      "role" => self::adminDAO()->getWorkspaceRole($authToken->getToken(), $workspaceId)
    ]);
  }

  public static function put(Request $request, Response $response): Response {
    $requestBody = JSON::decode($request->getBody()->getContents());
    if (!isset($requestBody->name)) {
      throw new HttpBadRequestException($request, "New workspace name missing");
    }

    $workspaceCreated = self::superAdminDAO()->createWorkspace($requestBody->name);

    $response->getBody()->write(htmlspecialchars($workspaceCreated['id']));
    return $response->withStatus(201);
  }

  public static function patch(Request $request, Response $response): Response {
    $requestBody = JSON::decode($request->getBody()->getContents());
    $workspaceId = (int) $request->getAttribute('ws_id');

    if (!isset($requestBody->name) or (!$requestBody->name)) {
      throw new HttpBadRequestException($request, "New name (name) is missing");
    }

    self::superAdminDAO()->setWorkspaceName($workspaceId, $requestBody->name);

    return $response;
  }

  public static function patchUsers(Request $request, Response $response): Response {
    $requestBody = JSON::decode($request->getBody()->getContents());
    $workspaceId = (int) $request->getAttribute('ws_id');

    if (!isset($requestBody->u) or (!count($requestBody->u))) {
      throw new HttpBadRequestException($request, "User-list (u) is missing");
    }

    self::superAdminDAO()->setUserRightsForWorkspace($workspaceId, $requestBody->u);

    return $response->withHeader('Content-type', 'text/plain;charset=UTF-8');
  }

  public static function getUsers(Request $request, Response $response): Response {
    $workspaceId = (int) $request->getAttribute('ws_id');

    return $response->withJson(self::superAdminDAO()->getUsersByWorkspace($workspaceId));
  }

  public static function getResults(Request $request, Response $response): Response {
    $workspaceId = (int) $request->getAttribute('ws_id');
    $results = self::adminDAO()->getResultStats($workspaceId);

    return $response->withJson($results);
  }

  public static function deleteResponses(Request $request, Response $response): Response {
    $workspaceId = (int) $request->getAttribute('ws_id');
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
    set_time_limit(600); // because password hashing may take a lot of time if many testtakers are provided
    $workspaceId = (int) $request->getAttribute('ws_id');
    $workspace = new Workspace($workspaceId);

    $uploadedFiles = UploadedFilesHandler::handleUploadedFiles($request, 'fileforvo', $workspace->getWorkspacePath());

    $importedFiles = $workspace->importUnsortedFiles($uploadedFiles);

    $reports = [];
    $loginsAffected = false;
    $containsErrors = false;
    foreach ($importedFiles as $localPath => /* @var $file File */ $file) {
      $reports[$localPath] = $file->getValidationReport();
      $containsErrors = ($containsErrors or (isset($reports[$localPath]['error']) and count($reports[$localPath]['error'])));
      $loginsAffected = ($loginsAffected or ($file->isValid() and ($file->getType() == 'Testtakers')));
    }

    if ($loginsAffected) {
      BroadcastService::send('system/clean');
    }

    return $response->withJson($reports)->withStatus($containsErrors ? 207 : 201);
  }

  public static function getFiles(Request $request, Response $response): Response {
    $workspaceId = (int) $request->getAttribute('ws_id');
    $workspace = new Workspace($workspaceId);

    $files = $workspace->workspaceDAO->getAllFiles();

    // TODo change the FE and endpoint to accept it with keys
    $fileDigestList = [];
    foreach ($files as $fileType => $fileList) {
      $fileDigestList[$fileType] = array_values($fileList);
    }

    return $response->withJson($fileDigestList);
  }

  /** TODO since only allowed files are in the five main folders, a better syntax for the body would suit
   * eg [{"type": "Booklet", "name": "SAMPLE_BOOKLET.XML"}]
   */
  public static function deleteFiles(Request $request, Response $response): Response {
    $workspaceId = (int) $request->getAttribute('ws_id');
    $filesToDelete = RequestBodyParser::getRequiredElement($request, 'f');

    $workspace = new Workspace($workspaceId);
    $deletionReport = $workspace->deleteFiles($filesToDelete);

    foreach ($deletionReport['deleted'] as $deletedFile) {
      list($type) = explode('/', $deletedFile);
      if ($type == 'Testtakers') {
        BroadcastService::send('system/clean');
        break;
      }
    }

    return $response->withJson($deletionReport)->withStatus(207);
  }

  public static function getReport(Request $request, Response $response): ?Response {
    $workspaceId = (int) $request->getAttribute('ws_id');

    $dataIds = $request->getParam('dataIds', '') === ''
      ? []
      : explode(',', $request->getParam('dataIds', ''));

    try {
      $reportType = ReportType::from($request->getAttribute('type'));
    } catch (ValueError $exception) {
      throw new HttpNotFoundException($request, "Report type '{$request->getAttribute('type')}' not found.");
    }

    $reportFormat = $request->getHeaderLine('Accept') == 'text/csv' ? ReportFormat::CSV : ReportFormat::JSON;

    $report = new Report($workspaceId, $dataIds, $reportType, $reportFormat);
    $report->generate();

    $response->getBody()->write($report->asString());
    $response = $reportFormat === ReportFormat::CSV
      ? $response->withHeader('Content-type', 'text/csv;charset=UTF-8')
      : $response->withHeader('Content-Type', 'application/json');

    return $response;
  }

  public static function getSysCheckReportsOverview(Request $request, Response $response): Response {
    $workspaceId = (int) $request->getAttribute('ws_id');

    $sysChecksFolder = new SysChecksFolder($workspaceId);
    $reports = $sysChecksFolder->getSysCheckReportList();

    return $response->withJson($reports);
  }

  public static function deleteSysCheckReports(Request $request, Response $response): Response {
    $workspaceId = (int) $request->getAttribute('ws_id');
    $checkIds = RequestBodyParser::getElementWithDefault($request, 'checkIds', []);

    $sysChecksFolder = new SysChecksFolder($workspaceId);
    $fileDeletionReport = $sysChecksFolder->deleteSysCheckReports($checkIds);

    return $response->withJson($fileDeletionReport)->withStatus(207);
  }

  public static function getSysCheck(Request $request, Response $response): Response {
    $workspaceId = (int) $request->getAttribute('ws_id');
    $sysCheckName = $request->getAttribute('sys-check_name');

    $workspaceController = new Workspace($workspaceId);
    /* @var XMLFileSysCheck $xmlFile */
    $xmlFile = $workspaceController->getFileById('SysCheck', $sysCheckName);

    return $response->withJson([
      'name' => $xmlFile->getId(),
      'label' => $xmlFile->getLabel(),
      'canSave' => $xmlFile->hasSaveKey(),
      'hasUnit' => $xmlFile->hasUnit(),
      'questions' => $xmlFile->getQuestions(),
      'customTexts' => (object) $xmlFile->getCustomTexts(),
      'skipNetwork' => $xmlFile->getSkipNetwork(),
      'downloadSpeed' => $xmlFile->getSpeedtestDownloadParams(),
      'uploadSpeed' => $xmlFile->getSpeedtestUploadParams(),
      'workspaceId' => $workspaceId
    ]);
  }

  public static function getSysCheckUnitAndPLayer(Request $request, Response $response): Response {
    $workspaceId = (int) $request->getAttribute('ws_id');
    $sysCheckName = $request->getAttribute('sys-check_name');

    $workspace = new Workspace($workspaceId);

    /* @var XMLFileSysCheck $sysCheck */
    $sysCheck = $workspace->getFileById('SysCheck', $sysCheckName);

    $res = [
      'player_id' => '',
      'def' => '',
      'player' => ''
    ];

    if (!$sysCheck->hasUnit()) {
      return $response->withJson($res);
    }

    $unit = $workspace->getFileById('Unit', $sysCheck->getUnitId());
    /* @var XMLFileUnit $unit */
    $unitRelations = $workspace->getFileRelations($unit);

    foreach ($unitRelations as $unitRelation) {
      /* @var FileRelation $unitRelation */

      switch ($unitRelation->getRelationshipType()) {
        case FileRelationshipType::isDefinedBy:

          $unitDefinitionFile = $workspace->getFileByName('Resource', $unitRelation->getTargetName());
          $res['def'] = $unitDefinitionFile->getContent();
          break;

        case FileRelationshipType::usesPlayer:

          $playerFile = $workspace->getFileByName('Resource', $unitRelation->getTargetName());
          $res['player'] = $playerFile->getContent();
          $res['player_id'] = $playerFile->getVeronaModuleId();
          break;
      }
    }

    if (!$res['def']) {
      $unitEmbeddedDefinition = $unit->getDefinition();
      if ($unitEmbeddedDefinition) {
        $res['def'] = $unitEmbeddedDefinition;
      }
    }

    return $response->withJson($res);
  }

  public static function putSysCheckReport(Request $request, Response $response): Response {
    $workspaceId = (int) $request->getAttribute('ws_id');
    $sysCheckName = $request->getAttribute('sys-check_name');
    $report = new SysCheckReport(JSON::decode($request->getBody()->getContents()));

    $sysChecksFolder = new SysChecksFolder($workspaceId);

    /* @var XMLFileSysCheck $sysCheck */
    $sysCheck = $sysChecksFolder->getFileById('SysCheck', $sysCheckName);

    if (strlen((string) $report->keyPhrase) <= 0) {
      throw new HttpBadRequestException($request, "No key `$report->keyPhrase`");
    }

    if (strtoupper((string) $report->keyPhrase) !== strtoupper($sysCheck->getSaveKey())) {
      throw new HttpError("Wrong key `$report->keyPhrase`", 403);
    }

    $report->checkId = $sysCheckName;
    $report->checkLabel = $sysCheck->getLabel();

    $sysChecksFolder->saveSysCheckReport($report);

    return $response->withStatus(201);
  }
}
