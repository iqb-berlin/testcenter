<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
final class ReportTest extends TestCase {
  private const BOM = "\xEF\xBB\xBF";
  private const LOGS = [
    [
      'groupname' => "sample_group",
      'loginname' => "sample_user",
      'code' => "xxx",
      'bookletname' => "BOOKLET.SAMPLE-1",
      'unitname' => "UNIT.SAMPLE",
      'timestamp' => "1627545600",
      'logentry' => "sample unit log"
    ], [
      'groupname' => "sample_group",
      'loginname' => "sample_user",
      'code' => "xxx",
      'bookletname' => "BOOKLET.SAMPLE-1",
      'unitname' => "",
      'timestamp' => "1627545600",
      'logentry' => "sample log entry"
    ]
  ];
  const RESPONSES = [
    [
      "groupname" => "sample_group",
      "loginname" => "sample_user",
      "code" => "xxx",
      "bookletname" => "BOOKLET.SAMPLE-1",
      "unitname" => "UNIT.SAMPLE",
      "responses" => "{\"name\":\"Sam Sample\",\"age\":34}",
      "responseType" => "",
      "response-ts" => "1627545600",
      "laststate" => "{\"PRESENTATIONCOMPLETE\":\"yes\"}"
    ],
    [
      "groupname" => "sämple_group",
      "loginname" => "sämple_user",
      "code" => "xxx",
      "bookletname" => "BOOKLET.SAMPLE-2",
      "unitname" => "UNIT.SÄMPLE",
      "responses" => "{\"name\":\"Säm Sämple\",\"age\":42}",
      "responseType" => "immediate",
      "response-ts" => "1627545600",
      "laststate" => ""
    ]
  ];
  const REVIEWS = [
    [
      "groupname" => "sample_group",
      "loginname" => "sample_user",
      "code" => "xxx",
      "bookletname" => "BOOKLET.SAMPLE-1",
      "unitname" => "UNIT.SAMPLE",
      "priority" => "1",
      "categories" => "",
      "reviewtime" => "2021-07-29 10:00:00",
      "entry" => "this is a sample unit review"
    ], [
      "groupname" => "sample_group",
      "loginname" => "sample_user",
      "code" => "xxx",
      "bookletname" => "BOOKLET.SAMPLE-1",
      "unitname" => "",
      "priority" => "1",
      "categories" => "",
      "reviewtime" => "2021-07-29 10:00:00",
      "entry" => "sample booklet review"
    ]
  ];
  const REVIEWS_WITH_DYNAMIC_CATEGORIES = [
    [
      "groupname" => "sample_group",
      "loginname" => "sample_user",
      "code" => "xxx",
      "bookletname" => "BOOKLET.SAMPLE-1",
      "unitname" => "UNIT.SAMPLE",
      "priority" => "1",
      "categories" => "tech",
      "reviewtime" => "2021-07-29 10:00:00",
      "entry" => "this is a sample unit review"
    ], [
      "groupname" => "sample_group",
      "loginname" => "sample_user",
      "code" => "xxx",
      "bookletname" => "BOOKLET.SAMPLE-1",
      "unitname" => "",
      "priority" => "1",
      "categories" => "content tech design",
      "reviewtime" => "2021-07-29 10:00:00",
      "entry" => "sample booklet review"
    ]
  ];
  const SYS_CHECKS = [
    [
      "date" => "2020-02-17 13:01:31",
      "checkId" => "SYSCHECK.SAMPLE",
      "checkLabel" => "An example SysCheck definition",
      "title" => "SAMPLE SYS-CHECK REPORT",
      "environment" => [
        [
          "id" => "0",
          "type" => "environment",
          "label" => "Betriebsystem",
          "value" => "Linux",
          "warning" => false
        ], [
          "id" => "0",
          "type" => "environment",
          "label" => "Betriebsystem-Version",
          "value" => "x86_64",
          "warning" => false
        ], [
          "id" => "0",
          "type" => "environment",
          "label" => "Bildschirm-Auflösung",
          "value" => "1680 x 1050",
          "warning" => false
        ], [
          "id" => "0",
          "type" => "environment",
          "label" => "Browser",
          "value" => "Chrome",
          "warning" => false
        ], [
          "id" => "0",
          "type" => "environment",
          "label" => "Browser-Cookies aktiviert",
          "value" => true,
          "warning" => false
        ], [
          "id" => "0",
          "type" => "environment",
          "label" => "Browser-Plugins:",
          "value" => "Chromium PDF Plugin, Chromium PDF Viewer",
          "warning" => false
        ], [
          "id" => "0",
          "type" => "environment",
          "label" => "Browser-Sprache",
          "value" => "en-US",
          "warning" => false
        ], [
          "id" => "0",
          "type" => "environment",
          "label" => "Browser-Version",
          "value" => "79",
          "warning" => false
        ], [
          "id" => "0",
          "type" => "environment",
          "label" => "CPU-Architektur",
          "value" => "amd64",
          "warning" => false
        ], [
          "id" => "0",
          "type" => "environment",
          "label" => "CPU-Kerne",
          "value" => 8,
          "warning" => false
        ], [
          "id" => "0",
          "type" => "environment",
          "label" => "Fenster-Größe",
          "value" => "1680 x 914",
          "warning" => false
        ]
      ],
      "network" => [
        [
          "id" => "0",
          "type" => "network",
          "label" => "Downloadgeschwindigkeit",
          "value" => "75.72 Mbit/s",
          "warning" => false
        ],
        [
          "id" => "0",
          "type" => "network",
          "label" => "Downloadgeschwindigkeit benötigt",
          "value" => "8.19 kbit/s",
          "warning" => false
        ],
        [
          "id" => "0",
          "type" => "network",
          "label" => "Downloadbewertung",
          "value" => "good",
          "warning" => false
        ],
        [
          "id" => "0",
          "type" => "network",
          "label" => "Uploadgeschwindigkeit",
          "value" => "2.84 Mbit/s",
          "warning" => false
        ],
        [
          "id" => "0",
          "type" => "network",
          "label" => "Uploadgeschwindigkeit benötigt",
          "value" => "8.19 kbit/s",
          "warning" => false
        ],
        [
          "id" => "0",
          "type" => "network",
          "label" => "Uploadbewertung",
          "value" => "good",
          "warning" => false
        ],
        [
          "id" => "0",
          "type" => "network",
          "label" => "Gesamtbewertung",
          "value" => "good",
          "warning" => false
        ],
        [
          "id" => "0",
          "type" => "network",
          "label" => "RoundTrip in Ms",
          "warning" => false,
          "value" => "100"
        ],
        [
          "id" => "0",
          "type" => "network",
          "label" => "Netzwerktyp nach Leistung",
          "warning" => false,
          "value" => "4g"
        ],
        [
          "id" => "0",
          "type" => "network",
          "label" => "Downlink MB/s",
          "warning" => false,
          "value" => "1.45"
        ]
      ],
      "questionnaire" => [
        [
          "id" => "2",
          "type" => "string",
          "label" => "Name",
          "value" => "Sam Sample",
          "warning" => false
        ], [
          "id" => "3",
          "type" => "select",
          "label" => "Who am I?",
          "value" => "Harvy Dent",
          "warning" => false
        ], [
          "id" => "4",
          "type" => "text",
          "label" => "Why so serious?",
          "value" => "Because.",
          "warning" => false
        ], [
          "id" => "5",
          "type" => "check",
          "label" => "Check this out",
          "value" => true,
          "warning" => false
        ], [
          "id" => "6",
          "type" => "radio",
          "label" => "All we here is",
          "value" => "Radio Gaga",
          "warning" => false
        ]
      ],
      "unit" => [
        [
          "id" => "0",
          "type" => "unit/player",
          "label" => "loading time",
          "value" => "1594.295166015625",
          "warning" => false
        ]
      ],
      "fileData" => [
        [
          "id" => "date",
          "label" => "DatumTS",
          "value" => "1627545600"
        ], [
          "id" => "datestr",
          "label" => "Datum",
          "value" => "2021-07-29 10:00:00"
        ], [
          "id" => "filename",
          "label" => "FileName",
          "value" => "SAMPLE_SYSCHECK-REPORT.JSON"
        ]
      ]
    ]
  ];
  const SYS_CHECK_SAMPLE_DATA_FILE = REAL_ROOT_DIR . "/sampledata/SysCheck-Report.json";

  private int $workspaceId;
  private array $dataIds;
  private ReportType $reportType;
  private ReportFormat $reportFormat;

  private AdminDAO $adminDaoMock;
  private SysChecksFolder $sysChecksFolderMock;

  public function setUp(): void {
    $this->workspaceId = 1;
    $this->dataIds = ["sample_group", "sample_group"];
    $this->adminDaoMock = $this->createMock(AdminDAO::class);
    $this->sysChecksFolderMock = $this->createMock(SysChecksFolder::class);
  }

  function test__construct(): void {
    // Arrange
    $this->reportType = new ReportType(ReportType::LOG);
    $this->reportFormat = new ReportFormat(ReportFormat::CSV);

    // Act
    $report = new Report($this->workspaceId, $this->dataIds, $this->reportType, $this->reportFormat);

    // Assert
    parent::assertEquals($this->workspaceId, $report->getWorkspaceId());
    parent::assertEquals($this->dataIds, $report->getDataIds());
    parent::assertEquals($this->reportType->getValue(), $report->getType());
    parent::assertEquals($this->reportFormat->getValue(), $report->getFormat());
  }

  function testGenerateLogsCSVReportWithSuccess(): void {
    // Arrange
    $this->reportType = new ReportType(ReportType::LOG);
    $this->reportFormat = new ReportFormat(ReportFormat::CSV);

    $this->adminDaoMock->method('getLogReportData')->willReturn(self::LOGS);

    $expectedLogsCSVReportData = self::BOM .
      "groupname;loginname;code;bookletname;unitname;timestamp;logentry\n" .
      "\"sample_group\";\"sample_user\";\"xxx\";\"BOOKLET.SAMPLE-1\";\"UNIT.SAMPLE\";\"1627545600\";sample unit log\n" .
      "\"sample_group\";\"sample_user\";\"xxx\";\"BOOKLET.SAMPLE-1\";\"\";\"1627545600\";sample log entry";

    // Act
    $report = new Report($this->workspaceId, $this->dataIds, $this->reportType, $this->reportFormat);
    $report->setAdminDAOInstance($this->adminDaoMock);
    $generationSuccess = $report->generate();

    // Assert
    $this->assertTrue($generationSuccess);
    parent::assertSame($expectedLogsCSVReportData, $report->getCsvReportData());
  }

  function testGenerateLogsJsonReportWithSuccess(): void {
    // Arrange
    $this->reportType = new ReportType(ReportType::LOG);
    $this->reportFormat = new ReportFormat(ReportFormat::CSV);
    $this->adminDaoMock->method('getLogReportData')->willReturn(self::LOGS);

    $expectedLogsJsonReportData = self::LOGS;

    // Act
    $report = new Report($this->workspaceId, $this->dataIds, $this->reportType, $this->reportFormat);
    $report->setAdminDAOInstance($this->adminDaoMock);
    $generationSuccess = $report->generate();

    // Assert
    $this->assertTrue($generationSuccess);
    parent::assertEquals($expectedLogsJsonReportData, $report->getReportData());
  }

  function testGenerateLogsCSVReportWithFailure(): void {
    $this->testGenerateLogsReportWithFailure(new ReportFormat(ReportFormat::CSV));
  }

  private function testGenerateLogsReportWithFailure(ReportFormat $reportFormat): void {
    // Arrange
    $this->adminDaoMock->method('getLogReportData')->willReturn([]);

    // Act
    $report = new Report(
      $this->workspaceId,
      $this->dataIds,
      new ReportType(ReportType::LOG),
      $reportFormat
    );
    $report->setAdminDAOInstance($this->adminDaoMock);
    $generationSuccess = $report->generate();

    // Assert
    $this->assertFalse($generationSuccess);
  }

  function testGenerateLogsJsonReportWithFailure(): void {
    $this->testGenerateLogsReportWithFailure(new ReportFormat(ReportFormat::JSON));
  }

  function testGenerateResponsesCSVReportWithSuccess(): void {
    // Arrange
    $this->reportType = new ReportType(ReportType::RESPONSE);
    $this->reportFormat = new ReportFormat(ReportFormat::CSV);

    $this->adminDaoMock->method('getResponseReportData')->willReturn(self::RESPONSES);

    $expectedResponsesCSVReportData = self::BOM .
      "groupname;loginname;code;bookletname;unitname;responses;laststate\n" .
      '"sample_group";"sample_user";"xxx";"BOOKLET.SAMPLE-1";"UNIT.SAMPLE";"""{\""name\"":\""Sam Sample\"",\""age\"":34}""";"{""PRESENTATIONCOMPLETE"":""yes""}"' . "\n" .
      '"sämple_group";"sämple_user";"xxx";"BOOKLET.SAMPLE-2";"UNIT.SÄMPLE";"""{\""name\"":\""S\u00e4m S\u00e4mple\"",\""age\"":42}""";""';

    // Act
    $report = new Report($this->workspaceId, $this->dataIds, $this->reportType, $this->reportFormat);
    $report->setAdminDAOInstance($this->adminDaoMock);
    $generationSuccess = $report->generate();

    // Assert
    $this->assertTrue($generationSuccess);
    parent::assertSame($expectedResponsesCSVReportData, $report->getCsvReportData());
  }

  function testGenerateResponsesJsonReportWithSuccess(): void {
    // Arrange
    $this->reportType = new ReportType(ReportType::RESPONSE);
    $this->reportFormat = new ReportFormat(ReportFormat::JSON);
    $this->adminDaoMock->method('getResponseReportData')->willReturn(self::RESPONSES);

    $expectedResponsesJsonReportData = self::RESPONSES;

    // Act
    $report = new Report($this->workspaceId, $this->dataIds, $this->reportType, $this->reportFormat);
    $report->setAdminDAOInstance($this->adminDaoMock);
    $generationSuccess = $report->generate();

    // Assert
    $this->assertTrue($generationSuccess);
    parent::assertEquals($expectedResponsesJsonReportData, $report->getReportData());
  }

  function testGenerateResponsesCSVReportWithFailure(): void {
    $this->testGenerateResponsesReportWithFailure(new ReportFormat(ReportFormat::CSV));
  }

  private function testGenerateResponsesReportWithFailure(ReportFormat $reportFormat): void {
    // Arrange
    $this->adminDaoMock->method('getResponseReportData')->willReturn([]);

    // Act
    $report = new Report(
      $this->workspaceId,
      $this->dataIds,
      new ReportType(ReportType::RESPONSE),
      $reportFormat
    );
    $report->setAdminDAOInstance($this->adminDaoMock);
    $generationSuccess = $report->generate();

    // Assert
    $this->assertFalse($generationSuccess);
  }

  function testGenerateResponsesJsonReportWithFailure(): void {
    $this->testGenerateresponsesReportWithFailure(new ReportFormat(ReportFormat::JSON));
  }

  function testGenerateReviewsCSVReportWithSuccess(): void {
    // Arrange
    $this->reportType = new ReportType(ReportType::REVIEW);
    $this->reportFormat = new ReportFormat(ReportFormat::CSV);

    $this->adminDaoMock->method('getReviewReportData')->willReturn(self::REVIEWS);

    $expectedReviewsCSVReportData = self::BOM .
      "groupname;loginname;code;bookletname;unitname;priority;reviewtime;entry\n" .
      "\"sample_group\";\"sample_user\";\"xxx\";\"BOOKLET.SAMPLE-1\";\"UNIT.SAMPLE\";\"1\";\"2021-07-29 10:00:00\";\"this is a sample unit review\"\n" .
      "\"sample_group\";\"sample_user\";\"xxx\";\"BOOKLET.SAMPLE-1\";\"\";\"1\";\"2021-07-29 10:00:00\";\"sample booklet review\"";

    // Act
    $report = new Report($this->workspaceId, $this->dataIds, $this->reportType, $this->reportFormat);
    $report->setAdminDAOInstance($this->adminDaoMock);
    $generationSuccess = $report->generate();

    // Assert
    $this->assertTrue($generationSuccess);
    parent::assertSame($expectedReviewsCSVReportData, $report->getCsvReportData());
  }

  function testGenerateDynamicReviewsCSVReportWithSuccess(): void {
    // Arrange
    $this->reportType = new ReportType(ReportType::REVIEW);
    $this->reportFormat = new ReportFormat(ReportFormat::CSV);

    $this->adminDaoMock->method('getReviewReportData')->willReturn(self::REVIEWS_WITH_DYNAMIC_CATEGORIES);

    $expectedReviewsCSVReportData = self::BOM .
      "groupname;loginname;code;bookletname;unitname;priority;category: content;category: design;category: tech;reviewtime;entry\n" .
      "\"sample_group\";\"sample_user\";\"xxx\";\"BOOKLET.SAMPLE-1\";\"UNIT.SAMPLE\";\"1\";;;\"X\";\"2021-07-29 10:00:00\";\"this is a sample unit review\"\n" .
      "\"sample_group\";\"sample_user\";\"xxx\";\"BOOKLET.SAMPLE-1\";\"\";\"1\";\"X\";\"X\";\"X\";\"2021-07-29 10:00:00\";\"sample booklet review\"";

    // Act
    $report = new Report($this->workspaceId, $this->dataIds, $this->reportType, $this->reportFormat);
    $report->setAdminDAOInstance($this->adminDaoMock);
    $generationSuccess = $report->generate();

    // Assert
    $this->assertTrue($generationSuccess);
    parent::assertSame($expectedReviewsCSVReportData, $report->getCsvReportData());
  }

  function testGenerateReviewsJsonReportWithSuccess(): void {
    // Arrange
    $this->reportType = new ReportType(ReportType::REVIEW);
    $this->reportFormat = new ReportFormat(ReportFormat::JSON);
    $this->adminDaoMock->method('getReviewReportData')->willReturn(self::REVIEWS);

    $expectedReviewsJsonReportData = array_map(

      function($review) {
        array_splice($review, array_search('categories', array_keys($review)), 1);

        return $review;
      },
      self::REVIEWS
    );

    // Act
    $report = new Report($this->workspaceId, $this->dataIds, $this->reportType, $this->reportFormat);
    $report->setAdminDAOInstance($this->adminDaoMock);
    $generationSuccess = $report->generate();

    // Assert
    $this->assertTrue($generationSuccess);
    parent::assertEquals($expectedReviewsJsonReportData, $report->getReportData());
  }

  function testGenerateDynamicReviewsJsonReportWithSuccess(): void {
    // Arrange
    $this->reportType = new ReportType(ReportType::REVIEW);
    $this->reportFormat = new ReportFormat(ReportFormat::JSON);
    $this->adminDaoMock->method('getReviewReportData')->willReturn(self::REVIEWS_WITH_DYNAMIC_CATEGORIES);

    $expectedReviewsJsonReportData = [
      [
        'groupname' => 'sample_group',
        'loginname' => 'sample_user',
        'code' => 'xxx',
        'bookletname' => 'BOOKLET.SAMPLE-1',
        'unitname' => 'UNIT.SAMPLE',
        'priority' => '1',
        'category: content' => null,
        'category: design' => null,
        'category: tech' => 'X',
        'reviewtime' => '2021-07-29 10:00:00',
        'entry' => 'this is a sample unit review'
      ], [
        'groupname' => 'sample_group',
        'loginname' => 'sample_user',
        'code' => 'xxx',
        'bookletname' => 'BOOKLET.SAMPLE-1',
        'unitname' => '',
        'priority' => '1',
        'category: content' => 'X',
        'category: design' => 'X',
        'category: tech' => 'X',
        'reviewtime' => '2021-07-29 10:00:00',
        'entry' => 'sample booklet review'
      ]
    ];

    // Act
    $report = new Report($this->workspaceId, $this->dataIds, $this->reportType, $this->reportFormat);
    $report->setAdminDAOInstance($this->adminDaoMock);
    $generationSuccess = $report->generate();

    // Assert
    $this->assertTrue($generationSuccess);
    parent::assertEquals($expectedReviewsJsonReportData, $report->getReportData());
  }

  function testGenerateReviewsCSVReportWithFailure(): void {
    $this->testGenerateReviewsReportWithFailure(new ReportFormat(ReportFormat::CSV));
  }

  private function testGenerateReviewsReportWithFailure(ReportFormat $reportFormat): void {
    // Arrange
    $this->adminDaoMock->method('getReviewReportData')->willReturn([]);

    // Act
    $report = new Report(
      $this->workspaceId,
      $this->dataIds,
      new ReportType(ReportType::REVIEW),
      $reportFormat,
    );
    $report->setAdminDAOInstance($this->adminDaoMock);
    $generationSuccess = $report->generate();

    // Assert
    $this->assertFalse($generationSuccess);
  }

  function testGenerateReviewsJsonReportWithFailure(): void {
    $this->testGenerateReviewsReportWithFailure(new ReportFormat(ReportFormat::JSON));
  }

  function testGenerateSysChecksCSVReportWithSuccess(): void {
    // Arrange
    $this->reportType = new ReportType(ReportType::SYSTEM_CHECK);
    $this->reportFormat = new ReportFormat(ReportFormat::CSV);
    $this->sysChecksFolderMock
      ->method('collectSysCheckReports')
      ->willReturn([new SysCheckReportFile(self::SYS_CHECK_SAMPLE_DATA_FILE)]);

    $expectedSysChecksCSVReportData = self::BOM .
      "\"Titel\";\"SysCheck-Id\";\"SysCheck\";\"DatumTS\";\"Datum\";\"FileName\";\"Betriebsystem\";\"Betriebsystem-Version\";\"Bildschirm-Auflösung\";\"Browser\";\"Browser-Cookies aktiviert\";\"Browser-Plugins:\";\"Browser-Sprache\";\"Browser-Version\";\"CPU-Architektur\";\"CPU-Kerne\";\"Fenster-Größe\";\"Downloadgeschwindigkeit\";\"Downloadgeschwindigkeit benötigt\";\"Downloadbewertung\";\"Uploadgeschwindigkeit\";\"Uploadgeschwindigkeit benötigt\";\"Uploadbewertung\";\"Gesamtbewertung\";\"RoundTrip in Ms\";\"Netzwerktyp nach Leistung\";\"Downlink MB/s\";\"Name\";\"Who am I?\";\"Why so serious?\";\"Check this out\";\"All we here is\";\"loading time\"\n" .
      "\"SAMPLE SYS-CHECK REPORT\";\"SYSCHECK.SAMPLE\";\"An example SysCheck definition\";\"" . filemtime(self::SYS_CHECK_SAMPLE_DATA_FILE) . "\";\"" . TimeStamp::toSQLFormat(filemtime(self::SYS_CHECK_SAMPLE_DATA_FILE)) . "\";\"" . basename(self::SYS_CHECK_SAMPLE_DATA_FILE) . "\";\"Linux\";\"x86_64\";\"1680 x 1050\";\"Chrome\";\"1\";\"Chromium PDF Plugin, Chromium PDF Viewer\";\"en-US\";\"79\";\"amd64\";\"8\";\"1680 x 914\";\"75.72 Mbit/s\";\"8.19 kbit/s\";\"good\";\"2.84 Mbit/s\";\"8.19 kbit/s\";\"good\";\"good\";\"100\";\"4g\";\"1.45\";\"Sam Sample\";\"Harvy Dent\";\"Because.\";\"1\";\"Radio Gaga\";\"1594.295166015625\"";

    // Act
    $report = new Report($this->workspaceId, $this->dataIds, $this->reportType, $this->reportFormat);
    $report->setSysChecksFolderInstance($this->sysChecksFolderMock);
    $generationSuccess = $report->generate();

    // Assert
    $this->assertTrue($generationSuccess);
    parent::assertSame($expectedSysChecksCSVReportData, $report->getCsvReportData());
  }

  function testGenerateSysChecksJsonReportWithSuccess(): void {
    // Arrange
    $this->reportType = new ReportType(ReportType::SYSTEM_CHECK);
    $this->reportFormat = new ReportFormat(ReportFormat::JSON);
    $this->sysChecksFolderMock
      ->method('collectSysCheckReports')
      ->willReturn([new SysCheckReportFile(self::SYS_CHECK_SAMPLE_DATA_FILE)]);

    $expectedSysChecksJsonReportData = self::SYS_CHECKS;
    $expectedSysChecksJsonReportData[0]["fileData"] = [
      [
        "id" => "date",
        "label" => "DatumTS",
        "value" => (string) filemtime(self::SYS_CHECK_SAMPLE_DATA_FILE)
      ], [
        "id" => "datestr",
        "label" => "Datum",
        "value" => TimeStamp::toSQLFormat(filemtime(self::SYS_CHECK_SAMPLE_DATA_FILE))
      ], [
        "id" => "filename",
        "label" => "FileName",
        "value" => basename(self::SYS_CHECK_SAMPLE_DATA_FILE)
      ]
    ];

    // Act
    $report = new Report($this->workspaceId, $this->dataIds, $this->reportType, $this->reportFormat);
    $report->setSysChecksFolderInstance($this->sysChecksFolderMock);
    $generationSuccess = $report->generate();

    // Assert
    $this->assertTrue($generationSuccess);
    parent::assertEquals($expectedSysChecksJsonReportData, $report->getReportData());
  }

  function testGenerateSysChecksCSVReportWithFailure(): void {
    $this->testGenerateSysChecksReportWithFailure(new ReportFormat(ReportFormat::CSV));
  }

  private function testGenerateSysChecksReportWithFailure(ReportFormat $reportFormat): void {
    // Arrange
    $this->sysChecksFolderMock
      ->method('collectSysCheckReports')
      ->willReturn([]);

    // Act
    $report = new Report(
      $this->workspaceId,
      $this->dataIds,
      new ReportType(ReportType::SYSTEM_CHECK),
      $reportFormat
    );
    $report->setSysChecksFolderInstance($this->sysChecksFolderMock);
    $generationSuccess = $report->generate();

    // Assert
    $this->assertFalse($generationSuccess);
  }

  function testGenerateSysChecksJsonReportWithFailure(): void {
    $this->testGenerateSysChecksReportWithFailure(new ReportFormat(ReportFormat::JSON));
  }
}
