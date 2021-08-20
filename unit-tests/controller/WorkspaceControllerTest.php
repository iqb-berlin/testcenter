<?php

declare(strict_types=1);

use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Slim\App;
use Slim\Exception\HttpNotFoundException;
use Slim\Exception\MethodNotAllowedException;
use Slim\Exception\NotFoundException;
use Slim\Http\Environment;
use Slim\Http\Request;
use Slim\Http\Response;


/**
 * @runTestsInSeparateProcesses
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


    static function setUpBeforeClass(): void {

        require_once "classes/controller/Controller.class.php";
        require_once "classes/controller/WorkspaceController.class.php";
        require_once "classes/workspace/Workspace.class.php";
        require_once "classes/data-collection/ReportType.php";
        require_once "classes/data-collection/ReportFormat.php";
        require_once "classes/exception/HttpException.class.php";
        require_once "classes/exception/HttpSpecializedException.class.php";
        require_once "classes/exception/HttpNotFoundException.class.php";
    }

    function setUp(): void {

        $this->callable = [WorkspaceController::class, 'getReport'];
        $this->reportMock = Mockery::mock('overload:' . Report::class);
        $this->adminDaoMock = Mockery::mock(AdminDAO::class);
        $this->sysChecksFolderMock = Mockery::mock(SysChecksFolder::class);
    }

    function tearDown(): void {

        Mockery::close();
    }

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithInvalidReportTypeAndCSVShouldThrowException(): void {

        $this->testGetReportWithInvalidReportTypeShouldThrowException('text/csv');
    }

    /**
     * @throws NotFoundException
     * @throws MethodNotAllowedException
     */
    private function testGetReportWithInvalidReportTypeShouldThrowException(string $mediaType): void {

        // Arrange
        $reportType = 'Invalid';
        $path = "/$this->workspaceId/report/$reportType";

        // Assert
        $this->expectException(HttpNotFoundException::class);

        // Act
        $this->callSlimFramework($path, $mediaType, $reportType);
    }

    /**
     * @param string $path
     * @param string $mediaType
     * @param string $reportType
     * @return ResponseInterface
     * @throws MethodNotAllowedException
     * @throws NotFoundException
     */
    private function callSlimFramework(string $path, string $mediaType, string $reportType): ResponseInterface {

        $app = new App();
        $app->get($path, $this->callable);

        $request = $this->createReportRequest($this->requestMethod, $mediaType, $this->workspaceId, $reportType, $this->dataIds);
        $response = $app($request, new Response());
        $response->getBody()->rewind();

        return $response;
    }

    /**
     * @param string $requestMethod
     * @param string $mediaType
     * @param int|null $workspaceId
     * @param string $reportType
     * @param string|null $dataIds
     * @return Request
     */
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

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithInvalidReportTypeAndJSONShouldThrowException(): void {

        $this->testGetReportWithInvalidReportTypeShouldThrowException('application/json');

    }

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithLogAndCSVAndEmptyDataIds(): void {

        $this->testGetReportWithEmptyDataIds(ReportType::LOG, 'text/csv', 'setAdminDAOInstance');
    }

    /**
     * @throws MethodNotAllowedException
     * @throws NotFoundException
     */
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

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithLogAndJSONAndEmptyDataIds(): void {

        $this->testGetReportWithEmptyDataIds(ReportType::LOG, 'application/json', 'setAdminDAOInstance');
    }

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithResponseAndCSVAndEmptyDataIds(): void {

        $this->testGetReportWithEmptyDataIds(ReportType::RESPONSE, 'text/csv', 'setAdminDAOInstance');
    }

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithResponseAndJSONAndEmptyDataIds(): void {

        $this->testGetReportWithEmptyDataIds(ReportType::RESPONSE, 'application/json', 'setAdminDAOInstance');
    }

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithReviewAndCSVAndEmptyDataIds(): void {

        $this->testGetReportWithEmptyDataIds(ReportType::REVIEW, 'text/csv', 'setAdminDAOInstance');
    }

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithReviewAndJSONAndEmptyDataIds(): void {

        $this->testGetReportWithEmptyDataIds(ReportType::REVIEW, 'application/json', 'setAdminDAOInstance');
    }

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithSystemCheckAndCSVAndEmptyDataIds(): void {

        $this->testGetReportWithEmptyDataIds(ReportType::SYSTEM_CHECK, 'text/csv', 'setSysChecksFolderInstance');
    }

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithSystemCheckAndJSONAndEmptyDataIds(): void {

        $this->testGetReportWithEmptyDataIds(ReportType::SYSTEM_CHECK, 'application/json', 'setSysChecksFolderInstance');
    }

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithLogAndCSVAndNoneReportGeneration(): void {

        $this->testGetReportWithoutReportGeneration(ReportType::LOG, 'text/csv', 'setAdminDAOInstance');
    }

    /**
     * @throws NotFoundException
     * @throws MethodNotAllowedException
     */
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

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithLogAndJSONAndNoneReportGeneration(): void {

        $this->testGetReportWithoutReportGeneration(ReportType::LOG, 'application/json', 'setAdminDAOInstance');
    }

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithResponseAndCSVAndNoneReportGeneration(): void {

        $this->testGetReportWithoutReportGeneration(ReportType::RESPONSE, 'text/csv', 'setAdminDAOInstance');
    }

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithResponseAndJSONAndNoneReportGeneration(): void {

        $this->testGetReportWithoutReportGeneration(ReportType::RESPONSE, 'application/json', 'setAdminDAOInstance');
    }

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithReviewAndCSVAndNoneReportGeneration(): void {

        $this->testGetReportWithoutReportGeneration(ReportType::REVIEW, 'text/csv', 'setAdminDAOInstance');
    }

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithReviewAndJSONAndNoneReportGeneration(): void {

        $this->testGetReportWithoutReportGeneration(ReportType::REVIEW, 'application/json', 'setAdminDAOInstance');
    }

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithSystemCheckAndCSVAndNoneReportGeneration(): void {

        $this->testGetReportWithoutReportGeneration(ReportType::SYSTEM_CHECK, 'text/csv', 'setSysChecksFolderInstance');
    }

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithSystemCheckAndJSONAndNoneReportGeneration(): void {

        $this->testGetReportWithoutReportGeneration(ReportType::SYSTEM_CHECK, 'application/json', 'setSysChecksFolderInstance');
    }

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithLogAndCSV(): void {

        $this->testGetCSVReport(ReportType::LOG, 'setAdminDAOInstance');
    }

    /**
     * @param string $reportType
     * @param string $expectedMethod
     * @throws MethodNotAllowedException
     * @throws NotFoundException
     */
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

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithLogAndJSON(): void {

        $this->testGetJSONReport(ReportType::LOG, 'application/json', ['application/json'], 'setAdminDAOInstance');
    }

    /**
     * @param string $reportType
     * @param string $mediaType
     * @param array $expectedContentTypes
     * @param string $expectedMethod
     * @throws MethodNotAllowedException
     * @throws NotFoundException
     */
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

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithResponseAndCSV(): void {

        $this->testGetCSVReport(ReportType::RESPONSE, 'setAdminDAOInstance');
    }

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithResponseAndJSON(): void {

        $this->testGetJSONReport(ReportType::RESPONSE, 'application/json', ['application/json'], 'setAdminDAOInstance');
    }

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithReviewAndCSV(): void {

        $this->testGetCSVReport(ReportType::REVIEW, 'setAdminDAOInstance');
    }

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithReviewAndJSON(): void {

        $this->testGetJSONReport(ReportType::REVIEW, 'application/json', ['application/json'], 'setAdminDAOInstance');
    }

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithSystemCheckAndCSV(): void {

        $this->testGetCSVReport(ReportType::SYSTEM_CHECK, 'setSysChecksFolderInstance');
    }

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithSystemCheckAndJSON(): void {

        $this->testGetJSONReport(ReportType::SYSTEM_CHECK, 'application/json', ['application/json'], 'setSysChecksFolderInstance');
    }


    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithLogAndInvalidAcceptHeader(): void {

        $this->testGetJSONReport(
            ReportType::LOG, 'application/xml', ['application/json'], 'setAdminDAOInstance');
    }

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithResponseAndInvalidAcceptHeader(): void {

        $this->testGetJSONReport(
            ReportType::RESPONSE, 'application/xml', ['application/json'], 'setAdminDAOInstance');
    }

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithReviewAndInvalidAcceptHeader(): void {

        $this->testGetJSONReport(
            ReportType::REVIEW, 'application/xml', ['application/json'], 'setAdminDAOInstance');
    }

    /**
     * @preserveGlobalState disabled
     * @throws Exception
     */
    function testGetReportWithSystemCheckAndInvalidAcceptHeader(): void {

        $this->testGetJSONReport(
            ReportType::SYSTEM_CHECK, 'application/xml', ['application/json'], 'setSysChecksFolderInstance');
    }

}
