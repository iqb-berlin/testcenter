<?php

declare(strict_types=1);

use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Slim\App;
use Slim\Exception\HttpNotFoundException;
use Slim\Http\Environment;
use Slim\Http\Request;
use Slim\Http\Response;


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
        ], [
            'key1' => "value3",
            'key2' => "value4"
        ]
    ];

    private array $callable;
    private Report $reportMock;
    private AdminDAO $adminDaoMock;
    private SysChecksFolder $sysChecksFolderMock;

    private string $requestMethod = 'GET';
    private int $workspaceId = 1;
    private string $dataIds = 'id1,id2';

    private Workspace $workspaceMock;
    private SessionDAO $sessionDaoMock;
    private UploadedFilesHandler $uploadedFilesHandler;

    function setUp(): void {

        require_once "unit-tests/test-helper/RequestCreator.class.php";
        require_once "classes/controller/Controller.class.php";
        require_once "classes/controller/WorkspaceController.class.php";
//        require_once "classes/workspace/Workspace.class.php";
        require_once "classes/data-collection/DataCollectionTypeSafe.class.php";
        require_once "classes/data-collection/ValidationReportEntry.class.php";
        require_once "classes/data-collection/PlayerMeta.class.php";
        require_once "classes/data-collection/PlayerMeta.class.php";
        require_once "classes/data-collection/ReportType.php";
        require_once "classes/data-collection/ReportFormat.php";
        require_once "classes/exception/HttpException.class.php";
        require_once "classes/exception/HttpSpecializedException.class.php";
        require_once "classes/exception/HttpNotFoundException.class.php";
        require_once "classes/helper/RequestBodyParser.class.php";
        require_once "classes/helper/JSON.class.php";
        require_once "classes/helper/FileName.class.php";
        require_once "classes/helper/XMLSchema.class.php";
        require_once "classes/helper/Version.class.php";
        require_once "classes/files/File.class.php";
        require_once "classes/files/ResourceFile.class.php";
        require_once "classes/files/XMLFile.class.php";

        $this->callable = [WorkspaceController::class, 'getReport'];
        $this->reportMock = Mockery::mock('overload:' . Report::class);
        $this->adminDaoMock = Mockery::mock(AdminDAO::class);
        $this->sysChecksFolderMock = Mockery::mock(SysChecksFolder::class);

        $this->workspaceMock = Mockery::mock('overload:' . Workspace::class);
        $this->sessionDaoMock = Mockery::mock('overload:' . SessionDAO::class);
        $this->uploadedFilesHandler = Mockery::mock('overload:' . UploadedFilesHandler::class);

        define('ROOT_DIR', REAL_ROOT_DIR);
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

        $app = new App();
        $app->get($path, $this->callable);

        $request = $this->createReportRequest($this->requestMethod, $mediaType, $this->workspaceId, $reportType, $this->dataIds);
        $response = $app($request, new Response());
        $response->getBody()->rewind();

        return $response;
    }


    private function createReportRequest(
        string  $requestMethod,
        string  $mediaType,
        int     $workspaceId,
        string  $reportType,
        ?string $dataIds
    ): Request {

        $environment = Environment::mock([
            'REQUEST_METHOD' => strtoupper($requestMethod),
            'REQUEST_URI' => "/$workspaceId/report/$reportType",
            'QUERY_STRING' => empty($dataIds) ? "" : "dataIds=$dataIds",
            'HTTP_ACCEPT' => $mediaType
        ]);
        $request = Request::createFromEnvironment($environment);
        $request = $request->withMethod(strtoupper($requestMethod));
        $request = $request->withAttributes([
            'ws_id' => $workspaceId,
            'type' => $reportType
        ]);

        return $request->withHeader('Content-Type', $mediaType);
    }


    function test_GetReport_WithInvalidReportTypeAndJSONShouldThrowException(): void {

        $this->testGetReportWithInvalidReportTypeShouldThrowException('application/json');
    }


    function test_GetReport_WithLogAndCSVAndEmptyDataIds(): void {

        $this->testGetReportWithEmptyDataIds(ReportType::LOG, 'text/csv', 'setAdminDAOInstance');
    }

    
    private function testGetReportWithEmptyDataIds(string $reportType, string $mediaType, string $expectedMethod): void {

        // Arrange
        $this->dataIds = "";
        $path = "/$this->workspaceId/report/$reportType";

        $this->reportMock->expects($expectedMethod)->withAnyArgs();


        // Act
        $response = $this->callSlimFramework($path, $mediaType, $reportType);

        // Assert
        parent::assertSame(200, $response->getStatusCode());
        parent::assertSame(1, sizeof($response->getHeader('Content-type')));
        parent::assertStringStartsWith($mediaType, $response->getHeader('Content-type')[0]);
        parent::assertEmpty($response->getBody()->getContents());
    }


    function test_GetReportWithLogAndJSONAndEmptyDataIds(): void {

        $this->testGetReportWithEmptyDataIds(ReportType::LOG, 'application/json', 'setAdminDAOInstance');
    }


    function test_GetReportWithResponseAndCSVAndEmptyDataIds(): void {

        $this->testGetReportWithEmptyDataIds(ReportType::RESPONSE, 'text/csv', 'setAdminDAOInstance');
    }


    function test_GetReportWithResponseAndJSONAndEmptyDataIds(): void {

        $this->testGetReportWithEmptyDataIds(ReportType::RESPONSE, 'application/json', 'setAdminDAOInstance');
    }


    function test_GetReportWithReviewAndCSVAndEmptyDataIds(): void {

        $this->testGetReportWithEmptyDataIds(ReportType::REVIEW, 'text/csv', 'setAdminDAOInstance');
    }


    function test_GetReportWithReviewAndJSONAndEmptyDataIds(): void {

        $this->testGetReportWithEmptyDataIds(ReportType::REVIEW, 'application/json', 'setAdminDAOInstance');
    }


    function test_GetReportWithSystemCheckAndCSVAndEmptyDataIds(): void {

        $this->testGetReportWithEmptyDataIds(ReportType::SYSTEM_CHECK, 'text/csv', 'setSysChecksFolderInstance');
    }


    function test_GetReportWithSystemCheckAndJSONAndEmptyDataIds(): void {

        $this->testGetReportWithEmptyDataIds(ReportType::SYSTEM_CHECK, 'application/json', 'setSysChecksFolderInstance');
    }


    function test_GetReportWithLogAndCSVAndNoneReportGeneration(): void {

        $this->testGetReportWithoutReportGeneration(ReportType::LOG, 'text/csv', 'setAdminDAOInstance');
    }


    private function testGetReportWithoutReportGeneration(string $reportType, string $mediaType, string $expectedMethod): void {

        // Arrange
        $path = "/$this->workspaceId/report/$reportType";

        $this->reportMock->expects($expectedMethod)->withAnyArgs();
        $this->reportMock->expects('generate')->andReturn(false);

        // Act
        $response = $this->callSlimFramework($path, $mediaType, $reportType);

        // Assert
        parent::assertSame(200, $response->getStatusCode());
        parent::assertSame(1, sizeof($response->getHeader('Content-type')));
        parent::assertStringStartsWith($mediaType, $response->getHeader('Content-type')[0]);
        parent::assertEmpty($response->getBody()->getContents());
    }


    function test_GetReport_LogAndJSONAndNoneReportGeneration(): void {

        $this->testGetReportWithoutReportGeneration(ReportType::LOG, 'application/json', 'setAdminDAOInstance');
    }


    function test_GetReport_ResponseAndCSVAndNoneReportGeneration(): void {

        $this->testGetReportWithoutReportGeneration(ReportType::RESPONSE, 'text/csv', 'setAdminDAOInstance');
    }


    function test_GetReport_ResponseAndJSONAndNoneReportGeneration(): void {

        $this->testGetReportWithoutReportGeneration(ReportType::RESPONSE, 'application/json', 'setAdminDAOInstance');
    }


    function test_GetReport_ReviewAndCSVAndNoneReportGeneration(): void {

        $this->testGetReportWithoutReportGeneration(ReportType::REVIEW, 'text/csv', 'setAdminDAOInstance');
    }


    function test_GetReport_ReviewAndJSONAndNoneReportGeneration(): void {

        $this->testGetReportWithoutReportGeneration(ReportType::REVIEW, 'application/json', 'setAdminDAOInstance');
    }


    function test_GetReport_SystemCheckAndCSVAndNoneReportGeneration(): void {

        $this->testGetReportWithoutReportGeneration(ReportType::SYSTEM_CHECK, 'text/csv', 'setSysChecksFolderInstance');
    }


    function test_GetReport_SystemCheckAndJSONAndNoneReportGeneration(): void {

        $this->testGetReportWithoutReportGeneration(ReportType::SYSTEM_CHECK, 'application/json', 'setSysChecksFolderInstance');
    }


    function test_GetReport_LogAndCSV(): void {

        $this->testGetCSVReport(ReportType::LOG, 'setAdminDAOInstance');
    }


    private function testGetCSVReport(string $reportType, string $expectedMethod): void {

        // Arrange
        $mediaType = 'text/csv';
        $path = "/$this->workspaceId/report/$reportType";

        $this->reportMock->expects($expectedMethod)->withAnyArgs();
        $this->reportMock->expects('generate')->andReturn(true);
        $this->reportMock->expects('getCsvReportData')->andReturn(self::CSV_REPORT_DATA_SAMPLE);

        // Act
        $response = $this->callSlimFramework($path, $mediaType, $reportType);

        // Assert
        parent::assertSame(200, $response->getStatusCode());
        parent::assertSame(["text/csv;charset=UTF-8"], $response->getHeader('Content-type'));
        parent::assertEquals(self::CSV_REPORT_DATA_SAMPLE, $response->getBody()->getContents());
    }


    function test_GetReport_LogAndJSON(): void {

        $this->testGetJSONReport(ReportType::LOG, 'application/json', ['application/json'], 'setAdminDAOInstance');
    }


    private function testGetJSONReport(string $reportType, string $mediaType, array $expectedContentTypes, string $expectedMethod): void {

        // Arrange
        $path = "/$this->workspaceId/report/$reportType";

        $this->reportMock->expects($expectedMethod)->withAnyArgs();
        $this->reportMock->expects('generate')->andReturn(true);
        $this->reportMock->expects('getReportData')->andReturn(self::JSON_REPORT_DATA_SAMPLE);

        // Act
        $response = $this->callSlimFramework($path, $mediaType, $reportType);

        // Assert
        parent::assertSame(200, $response->getStatusCode());
        parent::assertSame($expectedContentTypes, $response->getHeader('Content-type'));
        parent::assertEquals(json_encode(self::JSON_REPORT_DATA_SAMPLE), $response->getBody()->getContents());
    }


    function test_GetReport_ResponseAndCSV(): void {

        $this->testGetCSVReport(ReportType::RESPONSE, 'setAdminDAOInstance');
    }


    function test_GetReport_ResponseAndJSON(): void {

        $this->testGetJSONReport(ReportType::RESPONSE, 'application/json', ['application/json'], 'setAdminDAOInstance');
    }


    function test_GetReport_ReviewAndCSV(): void {

        $this->testGetCSVReport(ReportType::REVIEW, 'setAdminDAOInstance');
    }


    function test_GetReport_ReviewAndJSON(): void {

        $this->testGetJSONReport(ReportType::REVIEW, 'application/json', ['application/json'], 'setAdminDAOInstance');
    }


    function test_GetReport_SystemCheckAndCSV(): void {

        $this->testGetCSVReport(ReportType::SYSTEM_CHECK, 'setSysChecksFolderInstance');
    }


    function test_GetReport_SystemCheckAndJSON(): void {

        $this->testGetJSONReport(ReportType::SYSTEM_CHECK, 'application/json', ['application/json'], 'setSysChecksFolderInstance');
    }


    function test_GetReport_LogAndInvalidAcceptHeader(): void {

        $this->testGetJSONReport(
            ReportType::LOG, 'application/xml', ['application/json'], 'setAdminDAOInstance');
    }


    function test_GetReport_WithResponseAndInvalidAcceptHeader(): void {

        $this->testGetJSONReport(
            ReportType::RESPONSE, 'application/xml', ['application/json'], 'setAdminDAOInstance');
    }


    function test_GetReport_WithReviewAndInvalidAcceptHeader(): void {

        $this->testGetJSONReport(
            ReportType::REVIEW, 'application/xml', ['application/json'], 'setAdminDAOInstance');
    }


    function test_GetReport_WithSystemCheckAndInvalidAcceptHeader(): void {

        $this->testGetJSONReport(
            ReportType::SYSTEM_CHECK, 'application/xml', ['application/json'], 'setSysChecksFolderInstance');
    }


    function test_deleteFiles(): void {

        $deletionReport = [
            'deleted' => ['Testtakers/local_path.file', 'Booklet/other_local_path.xml'],
            'did_not_exist' => ['Unit/not_exist.xml'],
            'not_allowed' => ['Unit/not_allowed.xml'],
            'was_used' => ['Resource/in_use.voud']
        ];

        $deletionRequest = call_user_func_array('array_merge', array_values($deletionReport));

        $this->workspaceMock
            ->expects('deleteFiles')
            ->andReturn($deletionReport)
            ->once();

        $this->sessionDaoMock
            ->expects('deleteLoginSource')
            ->with(1, 'local_path.file')
            ->once()
            ->andReturn(2);

        $response = WorkspaceController::deleteFiles(
            RequestCreator::create(
                'DELETE',
                '/workspace/1/files/',
                json_encode(['f' => $deletionRequest])
            )->withAttribute('ws_id', 1),
            new Response()
        );

        $response->getBody()->rewind();

        $this->assertEquals(207, $response->getStatusCode());
        $this->assertEquals(json_encode($deletionReport), $response->getBody()->getContents());
    }


    function test_postFile() {

        $files = [
            'Booklet.xml' => file_get_contents(REAL_ROOT_DIR . '/sampledata/Booklet.xml'),
            'Unit2.xml' => file_get_contents(REAL_ROOT_DIR . '/sampledata/Unit2.xml'),
            'Testtakers.xml' => file_get_contents(REAL_ROOT_DIR . '/sampledata/Testtakers.xml')
        ];

        $filesAsFileObjects = array_reduce(
            array_keys($files),
            function($agg, $fileName) use ($files) {
                $agg[$fileName] = File::get($fileName, null, false, $files[$fileName]);
                return $agg;
            },
            []
        );

        $this->uploadedFilesHandler
            ->expects('handleUploadedFiles')
            ->andReturn($filesAsFileObjects);

        $response = WorkspaceController::postFile(
            RequestCreator::createFileUpload(
                'DELETE',
                '/workspace/1/files/',
                'fileforvo',
                $files
            )->withAttribute('ws_id', 1),
            new Response()
        );

        $response->getBody()->rewind();
    }
}
