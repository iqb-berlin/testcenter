<?php

declare(strict_types=1);

use DI\Container;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use Mockery\MockInterface;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Slim\Exception\HttpNotFoundException;
use Slim\Factory\AppFactory;
use Slim\Http\ServerRequest as Request;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
final class WorkspaceControllerTest extends TestCase {
  use MockeryPHPUnitIntegration;

  const CSV_REPORT_DATA_SAMPLE =
    "columnHeader1;columnHeader2;columnHeader3\n" .
    "cell11;cell12;cell13\n" .
    "cell21;cell22;cell23";
  const JSON_REPORT_DATA_SAMPLE = [
    [
      'key1' => "value1",
      'key2' => "value2"
    ],
    [
      'key1' => "value3",
      'key2' => "value4"
    ]
  ];

  private array $callable;
  private array $reportMock;
  private AdminDAO|MockInterface $adminDaoMock;
  private SysChecksFolder|MockInterface $sysChecksFolderMock;
  private Workspace|MockInterface $workspaceMock;
  private WorkspaceDAO|MockInterface $workspaceDaoMock;
  private UploadedFilesHandler|MockInterface $uploadedFilesHandler;
  private BroadcastService|MockInterface $broadcastingServiceMock;

  private string $requestMethod = 'GET';
  private int $workspaceId = 1;
  private string $dataIds = 'id1,id2';

  function setUp(): void {
    require_once "test/unit/test-helper/RequestCreator.class.php";
    require_once "test/unit/test-helper/ResponseCreator.class.php";
    require_once "test/unit/mock-classes/PasswordMock.php";

    $this->callable = [WorkspaceController::class, 'getReport'];
    $this->reportMock = [
      ReportType::LOG->value => Mockery::mock('overload:' . LogReportOutput::class),
      ReportType::RESPONSE->value => Mockery::mock('overload:' . ResponseReportOutput::class),
      ReportType::REVIEW->value => Mockery::mock('overload:' . ReviewReportOutput::class),
      ReportType::SYSCHECK->value => Mockery::mock('overload:' . SysCheckReportOutput::class)
    ];
    $this->adminDaoMock = Mockery::mock('overload:' . AdminDAO::class);
    $this->sysChecksFolderMock = Mockery::mock('overload:' . SysChecksFolder::class);
    $this->workspaceMock = Mockery::mock('overload:' . Workspace::class);
    $this->workspaceDaoMock = Mockery::mock( 'overload:' . WorkspaceDAO::class);

    $this->broadcastingServiceMock = Mockery::mock('overload:' . BroadcastService::class);
    $this->uploadedFilesHandler = Mockery::mock('overload:' . UploadedFilesHandler::class);
  }

  function tearDown(): void {
    Mockery::close();
  }

  function test_GetReport_WithInvalidReportTypeAndCSVShouldThrowException(): void {
    $this->testGetReportWithInvalidReportTypeShouldThrowException('text/csv');
  }

  private function testGetReportWithInvalidReportTypeShouldThrowException(string $mediaType): void {
    // Arrange
    $reportType = 'Invalid';
    $path = "/$this->workspaceId/report/$reportType";

    // Assert
    $this->expectException(HttpNotFoundException::class);

    // Act
    $this->callSlimFramework($path, $mediaType, $reportType);
  }

  private function callSlimFramework(string $path, string $mediaType, string $reportType): ResponseInterface {
    $container = new Container();
    AppFactory::setContainer($container);
    $app = AppFactory::create();
    $app->get($path, $this->callable);

    $request = $this->createReportRequest(
      $this->requestMethod,
      $mediaType,
      $this->workspaceId,
      $reportType,
      $this->dataIds
    );
    $response = $app->handle($request);
    $response->getBody()->rewind();

    return $response;
  }

  private function createReportRequest(
    string $requestMethod,
    string $mediaType,
    int $workspaceId,
    string $reportType,
    ?string $dataIds
  ): Request {
    $request = RequestCreator::create(
      strtoupper($requestMethod),
      "/$workspaceId/report/$reportType",
      "",
      [
        'REQUEST_METHOD' => strtoupper($requestMethod),
        'REQUEST_URI' => "/$workspaceId/report/$reportType"
      ]
    );
    $request = $request->withAttributes([
      'ws_id' => $workspaceId,
      'type' => $reportType
    ]);
    $request = $request->withHeader('HTTP_ACCEPT', $mediaType);
    $request = $request->withQueryParams(empty($dataIds) ? [] : ['dataIds' => $dataIds]);

    return $request->withHeader('Content-Type', $mediaType);
  }

  function test_GetReport_WithInvalidReportTypeAndJSONShouldThrowException(): void {
    $this->testGetReportWithInvalidReportTypeShouldThrowException('application/json');
  }

  function test_GetReport_WithLogAndCSVAndEmptyDataIds(): void {
    $this->testGetReportWithEmptyDataIds(ReportType::LOG->value, 'text/csv');
  }

  private function testGetReportWithEmptyDataIds(
    string $reportType,
    string $mediaType,
    ?string $expectedMethod = null
  ): void {
    // Arrange
    $this->dataIds = "";
    $path = "/$this->workspaceId/report/$reportType";

    if ($expectedMethod) {
      $this->reportMock[$reportType]->expects($expectedMethod)->withAnyArgs();
    }
    $this->reportMock[$reportType]->expects('generate')->andReturn(false);

    // Act
    $response = $this->callSlimFramework($path, $mediaType, $reportType);

    // Assert
    parent::assertSame(200, $response->getStatusCode());
    parent::assertSame(1, sizeof($response->getHeader('Content-type')));
    parent::assertStringStartsWith($mediaType, $response->getHeader('Content-type')[0]);
    parent::assertEmpty($response->getBody()->getContents());
  }

  function test_GetReportWithLogAndJSONAndEmptyDataIds(): void {
    $this->testGetReportWithEmptyDataIds(ReportType::LOG->value, 'application/json');
  }

  function test_GetReportWithResponseAndCSVAndEmptyDataIds(): void {
    $this->testGetReportWithEmptyDataIds(ReportType::RESPONSE->value, 'text/csv');
  }

  function test_GetReportWithResponseAndJSONAndEmptyDataIds(): void {
    $this->testGetReportWithEmptyDataIds(ReportType::RESPONSE->value, 'application/json');
  }

  function test_GetReportWithReviewAndCSVAndEmptyDataIds(): void {
    $this->testGetReportWithEmptyDataIds(ReportType::REVIEW->value, 'text/csv');
  }

  function test_GetReportWithReviewAndJSONAndEmptyDataIds(): void {
    $this->testGetReportWithEmptyDataIds(ReportType::REVIEW->value, 'application/json');
  }

  function test_GetReportWithSystemCheckAndCSVAndEmptyDataIds(): void {
    $this->testGetReportWithEmptyDataIds(ReportType::SYSCHECK->value, 'text/csv');
  }

  function test_GetReportWithSystemCheckAndJSONAndEmptyDataIds(): void {
    $this->testGetReportWithEmptyDataIds(ReportType::SYSCHECK->value, 'application/json');
  }

  function test_GetReportWithLogAndCSVAndNoneReportGeneration(): void {
    $this->testGetReportWithoutReportGeneration(ReportType::LOG->value, 'text/csv');
  }

  private function testGetReportWithoutReportGeneration(
    string $reportType,
    string $mediaType,
    ?string $expectedMethod = null
  ): void {
    // Arrange
    $path = "/$this->workspaceId/report/$reportType";

    if ($expectedMethod) {
      $this->reportMock[$reportType]->expects($expectedMethod)->withAnyArgs();
    }
    $this->reportMock[$reportType]->expects('generate')->andReturn(false);

    // Act
    $response = $this->callSlimFramework($path, $mediaType, $reportType);

    // Assert
    parent::assertSame(200, $response->getStatusCode());
    parent::assertSame(1, sizeof($response->getHeader('Content-type')));
    parent::assertStringStartsWith($mediaType, $response->getHeader('Content-type')[0]);
    parent::assertEmpty($response->getBody()->getContents());
  }

  function test_GetReport_LogAndJSONAndNoneReportGeneration(): void {
    $this->testGetReportWithoutReportGeneration(ReportType::LOG->value, 'application/json');
  }

  function test_GetReport_ResponseAndCSVAndNoneReportGeneration(): void {
    $this->testGetReportWithoutReportGeneration(ReportType::RESPONSE->value, 'text/csv');
  }

  function test_GetReport_ResponseAndJSONAndNoneReportGeneration(): void {
    $this->testGetReportWithoutReportGeneration(ReportType::RESPONSE->value, 'application/json');
  }

  function test_GetReport_ReviewAndCSVAndNoneReportGeneration(): void {
    $this->testGetReportWithoutReportGeneration(ReportType::REVIEW->value, 'text/csv');
  }

  function test_GetReport_ReviewAndJSONAndNoneReportGeneration(): void {
    $this->testGetReportWithoutReportGeneration(ReportType::REVIEW->value, 'application/json');
  }

  function test_GetReport_SystemCheckAndCSVAndNoneReportGeneration(): void {
    $this->testGetReportWithoutReportGeneration(ReportType::SYSCHECK->value, 'text/csv');
  }

  function test_GetReport_SystemCheckAndJSONAndNoneReportGeneration(): void {
    $this->testGetReportWithoutReportGeneration(ReportType::SYSCHECK->value, 'application/json');
  }

  function test_GetReport_LogAndCSV(): void {
    $this->testGetCSVReport(ReportType::LOG->value);
  }

  private function testGetCSVReport(string $reportType, ?string $expectedMethod = null): void {
    // Arrange
    $mediaType = 'text/csv';
    $path = "/$this->workspaceId/report/$reportType";

    if ($expectedMethod) {
      $this->reportMock[$reportType]->expects($expectedMethod)->withAnyArgs();
    }
    $this->reportMock[$reportType]->expects('generate')->andReturn(true);
    $this->reportMock[$reportType]->expects('asString')->andReturn(self::CSV_REPORT_DATA_SAMPLE);

    // Act
    $response = $this->callSlimFramework($path, $mediaType, $reportType);

    // Assert
    parent::assertSame(200, $response->getStatusCode());
    parent::assertSame(["text/csv;charset=UTF-8"], $response->getHeader('Content-type'));
    parent::assertEquals(self::CSV_REPORT_DATA_SAMPLE, $response->getBody()->getContents());
  }

  function test_GetReport_LogAndJSON(): void {
    $this->testGetJSONReport(ReportType::LOG->value, 'application/json', ['application/json']);
  }

  private function testGetJSONReport(
    string $reportType,
    string $mediaType,
    array $expectedContentTypes,
    ?string $expectedMethod = null
  ): void {
    // Arrange
    $path = "/$this->workspaceId/report/$reportType";

    if ($expectedMethod) {
      $this->reportMock[$reportType]->expects($expectedMethod)->withAnyArgs();
    }
    $this->reportMock[$reportType]->expects('generate')->andReturn(true);
    $this->reportMock[$reportType]->expects('asString')->andReturn(json_encode(self::JSON_REPORT_DATA_SAMPLE));

    // Act
    $response = $this->callSlimFramework($path, $mediaType, $reportType);

    // Assert
    parent::assertSame(200, $response->getStatusCode());
    parent::assertSame($expectedContentTypes, $response->getHeader('Content-type'));
    parent::assertEquals(json_encode(self::JSON_REPORT_DATA_SAMPLE), $response->getBody()->getContents());
  }

  function test_GetReport_ResponseAndCSV(): void {
    $this->testGetCSVReport(ReportType::RESPONSE->value);
  }

  function test_GetReport_ResponseAndJSON(): void {
    $this->testGetJSONReport(ReportType::RESPONSE->value, 'application/json', ['application/json']);
  }

  function test_GetReport_ReviewAndCSV(): void {
    $this->testGetCSVReport(ReportType::REVIEW->value);
  }

  function test_GetReport_ReviewAndJSON(): void {
    $this->testGetJSONReport(ReportType::REVIEW->value, 'application/json', ['application/json']);
  }

  function test_GetReport_SystemCheckAndCSV(): void {
    $this->testGetCSVReport(ReportType::SYSCHECK->value);
  }

  function test_GetReport_SystemCheckAndJSON(): void {
    $this->testGetJSONReport(ReportType::SYSCHECK->value, 'application/json', ['application/json']);
  }

  function test_GetReport_LogAndInvalidAcceptHeader(): void {
    $this->testGetJSONReport(
      ReportType::LOG->value,
      'application/xml',
      ['application/json']
    );
  }

  function test_GetReport_WithResponseAndInvalidAcceptHeader(): void {
    $this->testGetJSONReport(
      ReportType::RESPONSE->value,
      'application/xml',
      ['application/json']
    );
  }

  function test_GetReport_WithReviewAndInvalidAcceptHeader(): void {
    $this->testGetJSONReport(
      ReportType::REVIEW->value,
      'application/xml',
      ['application/json']
    );
  }

  function test_GetReport_WithSystemCheckAndInvalidAcceptHeader(): void {
    $this->testGetJSONReport(
      ReportType::SYSCHECK->value,
      'application/xml',
      ['application/json']
    );
  }

  function test_deleteFiles(): void {
    $deletionReport = new FileDeletionReport(
      deleted: ['Testtakers/local_path.file', 'Booklet/other_local_path.xml'],
      did_not_exist: ['Unit/not_exist.xml'],
      not_allowed: ['Unit/not_allowed.xml'],
      was_used: ['Resource/in_use.voud']
    );

    $deletionRequest = ['Testtakers/local_path.file', 'Booklet/other_local_path.xml', 'Unit/not_exist.xml','Unit/not_allowed.xml','Resource/in_use.voud'];

    $this->workspaceMock
      ->expects('deleteFiles')
      ->andReturn($deletionReport)
      ->once();

    $this->workspaceMock
      ->expects('setWorkspaceHash')
      ->once();

    $this->workspaceDaoMock
      ->expects()
      ->setSysCheckMode('mixed');

    $this->broadcastingServiceMock
      ->expects('send')
      ->times(1)
      ->andReturn();

    $response = WorkspaceController::deleteFiles(
      RequestCreator::create(
        'DELETE',
        '/workspace/1/files/',
        json_encode(['f' => $deletionRequest])
      )->withAttribute('ws_id', 1),
      ResponseCreator::createEmpty()
    );

    $response->getBody()->rewind();

    $this->assertEquals(207, $response->getStatusCode());
    $this->assertEquals(json_encode($deletionReport), $response->getBody()->getContents());
  }

  function test_postFile() {
    $booklet = XMLFileBooklet::fromString(file_get_contents(ROOT_DIR . '/sampledata/Booklet.xml'), 'Booklet.xml');
    $unit = XMLFileUnit::fromString(file_get_contents(ROOT_DIR . '/sampledata/Unit2.xml') . 'is_bogus', 'Unit2.xml');
    $testtakers = XMLFileTesttakers::fromString(
      file_get_contents(ROOT_DIR . '/sampledata/Testtakers.xml'),
      'Testtakers.xml'
    );
    $files = [
      'Booklet.xml' => $booklet,
      'Unit2.xml' => $unit,
      'Testtakers.xml' => $testtakers
    ];

    $fileReports = array_reduce(
      array_keys($files),
      function ($agg, $fileName) use ($files) {
        $agg[$fileName] = ['type' => $files[$fileName]->getType(), ...$files[$fileName]->getValidationReport()];
        return $agg;
      },
      []
    );

    $filesContents = array_reduce(
      array_keys($files),
      function ($agg, $fileName) use ($files) {
        $agg[$fileName] = $files[$fileName]->getContent();
        return $agg;
      },
      []
    );

    $this->workspaceMock
      ->expects('importUncategorizedFiles')
      ->times(1)
      ->andReturn($fileReports);

    $this->workspaceMock
      ->expects('setWorkspaceHash')
      ->once();

    $this->workspaceMock
      ->expects('getWorkspacePath')
      ->once()
      ->andReturn('..whataver');

    $this->uploadedFilesHandler
      ->expects('handleUploadedFiles')
      ->once()
      ->andReturn(array_keys($files));

    $this->broadcastingServiceMock
      ->expects('send')
      ->times(1)
      ->andReturn();

    $response = WorkspaceController::postFile(
      RequestCreator::createFileUpload(
        'POST',
        '/workspace/1/files/',
        'fileforvo',
        $filesContents
      )->withAttribute('ws_id', 1),
      ResponseCreator::createEmpty()
    );

    $response->getBody()->rewind();

    $this->assertEquals(207, $response->getStatusCode());
    $this->assertEquals(
      '{"Booklet.xml":[],"Unit2.xml":{"error":["Error [5] in line 69: Extra content at the end of the document"]},"Testtakers.xml":[]}',
      $response->getBody()->getContents()
    );
  }
}
