<?php

declare(strict_types=1);

class Report {

  private const string BOM = "\xEF\xBB\xBF";         // UTF-8 BOM for MS Excel
  private const string DELIMITER = ';';              // standard delimiter for MS Excel
  private const string ENCLOSURE = '"';
  private const string LINE_ENDING = "\n";
  private const string CSV_CELL_FORMAT = self::ENCLOSURE . "%s" . self::ENCLOSURE;

  private int $workspaceId;
  private array $dataIds;
  private ReportType $type;
  private ReportFormat $format;
  private AdminDAO $adminDAO;
  private SysChecksFolder $sysChecksFolder;

  private string $csvReportData;
  private array $reportData;
  private bool $useNewVersion = false;

  /**
   * Report constructor.
   * @param int $workspaceId The workspace identifier
   * @param array $dataIds The identifiers of report data depending on specific workspace
   * @param ReportType $reportType The report type
   * @param ReportFormat $reportFormat The report format
   */
  function __construct(int $workspaceId, array $dataIds, ReportType $reportType, ReportFormat $reportFormat) {
    $this->workspaceId = $workspaceId;
    $this->dataIds = $dataIds;
    $this->type = $reportType;
    $this->format = $reportFormat;
  }

  /**
   * @return int
   */
  public function getWorkspaceId(): int {
    return $this->workspaceId;
  }

  /**
   * @return array
   */
  public function getDataIds(): array {
    return $this->dataIds;
  }

  /**
   * @return string
   */
  public function getType(): ReportType {
    return $this->type;
  }

  public function getFormat(): ReportFormat {
    return $this->format;
  }

  /**
   * @param AdminDAO $adminDAO
   */
  public function setAdminDAOInstance(AdminDAO $adminDAO): void {
    if (!isset($this->adminDAO)) {
      $this->adminDAO = $adminDAO;
    }
  }

  /**
   * @param SysChecksFolder $sysChecksFolder
   */
  public function setSysChecksFolderInstance(SysChecksFolder $sysChecksFolder): void {
    if (!isset($this->sysChecksFolder)) {
      $this->sysChecksFolder = $sysChecksFolder;
    }
  }

  /**
   * @return string Raw CSV report data
   */
  public function getCsvReportData(): string {
    return $this->csvReportData;
  }

  public function asString(): string {
    return match ($this->format) {
      ReportFormat::CSV => $this->csvReportData,
      ReportFormat::JSON => json_encode($this->reportData)
    };
  }

  public function getReportData(): array {
    return $this->reportData;
  }

  public function generate(bool $useNewVersion = false): bool {
    $this->useNewVersion = $useNewVersion;
    switch ($this->type) {
      case ReportType::LOG:
        $adminDAO = new AdminDAO();
        $logs = $adminDAO->getLogReportData($this->workspaceId, $this->dataIds);

        if (empty($logs)) {
          return false;

        } else {
          $this->reportData = $logs;

          if ($this->format == ReportFormat::CSV) {
            $this->csvReportData = $this->generateLogsCSVReport($logs);
          }
        }

        break;

      case ReportType::RESPONSE:
        $adminDAO = new AdminDAO();
        $responses = $adminDAO->getResponseReportData($this->workspaceId, $this->dataIds);

        if (empty($responses)) {
          return false;

        } else {
          $this->reportData = $responses;

          if ($this->format == ReportFormat::CSV) {
            $this->csvReportData = $this->generateResponsesCSVReport($responses);
          }
        }

        break;

      case ReportType::REVIEW:
        $adminDAO = new AdminDAO();
        $reviewData = $adminDAO->getReviewReportData($this->workspaceId, $this->dataIds);
        $reviewData = $this->transformReviewData($reviewData);

        if (empty($reviewData)) {
          return false;

        } else {
          $this->reportData = $reviewData;

          if ($this->format == ReportFormat::CSV) {
            $this->csvReportData = $this->generateReviewsCSVReport($reviewData);
          }
        }

        break;

      case ReportType::SYSCHECK:
        $sysChecksFolder = new SysChecksFolder($this->workspaceId);
        $systemChecks = $sysChecksFolder->collectSysCheckReports($this->dataIds);

        if (empty($systemChecks)) {
          return false;

        } else {
          $this->reportData = array_map(
            function(SysCheckReportFile $report) {
              return $report->getReport();
            },
            $systemChecks
          );

          if ($this->format == ReportFormat::CSV) {
            $flatReports = array_map(
              function(SysCheckReportFile $report) {
                return $report->getFlatReport();
              },
              $systemChecks
            );
            $this->csvReportData = self::BOM .
              CSV::build(
                $flatReports,
                [],
                self::DELIMITER,
                self::ENCLOSURE,
                self::LINE_ENDING
              );
          }
        }
        break;
    }

    return true;
  }

  /**
   * @param array $logData An array of Log data
   * @return string A raw csv report of Logs
   */
  private function generateLogsCSVReport(array $logData): string {
    $columns = ['groupname', 'loginname', 'code', 'bookletname', 'unitname', 'originalUnitId', 'timestamp', 'logentry']; // TODO: Adjust column headers?
    $csv[] = implode(self::DELIMITER, $columns);

    foreach ($logData as $log) {
      $csv[] = implode(
        self::DELIMITER,
        [
          sprintf(self::CSV_CELL_FORMAT, $log['groupname']),
          sprintf(self::CSV_CELL_FORMAT, $log['loginname']),
          sprintf(self::CSV_CELL_FORMAT, $log['code']),
          sprintf(self::CSV_CELL_FORMAT, $log['bookletname']),
          sprintf(self::CSV_CELL_FORMAT, $log['unitname']),
          sprintf(self::CSV_CELL_FORMAT, $log['originalUnitId']),
          sprintf(self::CSV_CELL_FORMAT, $log['timestamp']),
          preg_replace("/\\\\\"/", '""', $log['logentry'])   // TODO: adjust replacement & use cell enclosure ?
        ]
      );
    }

    $csv = implode(self::LINE_ENDING, $csv);

    return self::BOM . $csv;
  }

  /**
   * @param array $responseData
   * @return string A raw csv report of responses
   */
  private function generateResponsesCSVReport(array $responseData): string {
    $csv[] = implode(
      self::DELIMITER,
      ['groupname', 'loginname', 'code', 'bookletname', 'unitname', 'originalUnitId', 'responses', 'laststate']
    );

    foreach ($responseData as $row) {
      $csv[] = implode(
        self::DELIMITER,
        [
          sprintf(self::CSV_CELL_FORMAT, $row['groupname']),
          sprintf(self::CSV_CELL_FORMAT, $row['loginname']),
          sprintf(self::CSV_CELL_FORMAT, $row['code']),
          sprintf(self::CSV_CELL_FORMAT, $row['bookletname']),
          sprintf(self::CSV_CELL_FORMAT, $row['unitname']),
          sprintf(self::CSV_CELL_FORMAT, $row['originalUnitId']),
          sprintf(self::CSV_CELL_FORMAT, preg_replace('/"/', '""', json_encode($row['responses']))),
          sprintf(self::CSV_CELL_FORMAT, preg_replace('/"/', '""', $row['laststate'] ?? ''))
        ]
      );

    }

    $csv = implode(self::LINE_ENDING, $csv);

    return self::BOM . $csv;
  }

  /**
   * @param array $reviewData An array of Review data
   * @return array An array transformed Review data
   */
  private function transformReviewData(array $reviewData): array {
    $transformedReviewData = [];
    $categoryKeys = $this->extractCategoryKeys($reviewData);

    foreach ($reviewData as $review) {
      $offset = array_search('categories', array_keys($review));
      $transformedReview =
        array_slice($review, 0, $offset) +
        $this->fillCategories($categoryKeys, explode(" ", trim($review['categories']) ?? '')) +
        array_slice($review, $offset + 1, null);

      $transformedReviewData[] = $this->useNewVersion ?
        $this->returnArrayWithSeperateEntry($transformedReview)
        : $transformedReview;
    }

    return $transformedReviewData;
  }

  /**
   * @param array $reviewData An array of Review data
   * @return array A map of category keys
   */
  private function extractCategoryKeys(array $reviewData): array {
    $categoryMap = [];

    foreach ($reviewData as $reviewEntry) {
      if (!empty($reviewEntry['categories'])) {
        $categories = explode(" ", trim($reviewEntry['categories']));

        foreach ($categories as $category) {
          if (0 === count(array_keys($categoryMap, $category))) {
            $categoryMap[] = $category;
          }
        }
      }
    }
    asort($categoryMap);

    return $categoryMap;
  }

  /**
   * @param array $categoryKeys An array of category keys
   * @param array $categoryValues An array of category values
   * @return array An associated array of category keys and transformed category values
   */
  private function fillCategories(array $categoryKeys, array $categoryValues): array {
    $categories = [];

    foreach ($categoryKeys as $categoryKey) {
      $isMatch = false;

      foreach ($categoryValues as $categoryValue) {
        if ($categoryKey === $categoryValue) {
          $isMatch = true;
          break;
        }
      }
      if ($this->useNewVersion) {
        if ($this->format == ReportFormat::CSV) {
          $categories["category_" . $categoryKey] = $isMatch ? 'TRUE' : 'FALSE';
        } else {
          $categories["category_" . $categoryKey] = $isMatch;
        }
      } else {
        $categories["category: " . $categoryKey] = $isMatch ? 'X' : null;
      }
    }

    return $categories;
  }

  /**
   * @param array $reviewData An array of Review data
   * @return string A raw csv report of reviews
   */
  private function generateReviewsCSVReport(array $reviewData): string {
    $csv[] = implode(self::DELIMITER, CSV::collectColumnNamesFromHeterogeneousObjects($reviewData));   // TODO: Adjust column headers?

    foreach ($reviewData as $review) {
      $csv[] = implode(
        self::DELIMITER,
        array_map(
          function($reviewProperty) {
            return isset($reviewProperty) ? sprintf(self::CSV_CELL_FORMAT, $reviewProperty) : $reviewProperty;
          },
          $review
        )
      );
    }

    $csv = implode(self::LINE_ENDING, $csv);

    return self::BOM . $csv;
  }

  private function returnArrayWithSeperateEntry(array $reviewData): array {
    [$reviewer, $entry] = explode(': ', $reviewData['entry'], 2);
    unset($reviewData['entry']);
    // if delimiter is not found, because of empty reviewer, the exploded string will be saved in $reviewer only
    if ($entry) {
      $reviewData['reviewer'] = $reviewer;
      $reviewData['entry'] = $entry;
    } else {
      $reviewData['reviewer'] = null;
      $reviewData['entry'] = $reviewer;
    }

    return $reviewData;
  }

}
