<?php

declare(strict_types=1);

abstract class Report {

  public const string BOM = "\xEF\xBB\xBF";         // UTF-8 BOM for MS Excel
  public const string DELIMITER = ';';              // standard delimiter for MS Excel
  public const string ENCLOSURE = '"';
  public const string LINE_ENDING = "\n";
  public const string CSV_CELL_FORMAT = self::ENCLOSURE . "%s" . self::ENCLOSURE;

  protected int $workspaceId;
  protected array $dataIds;
  protected ReportFormat $format;
  protected AdminDAO $adminDAO;
  protected SysChecksFolder $sysChecksFolder;

  protected string $csvReportData;
  protected array $reportData;
  protected bool $useNewVersion = false;

  function __construct(int $workspaceId, array $dataIds, ReportFormat $reportFormat) {
    $this->workspaceId = $workspaceId;
    $this->dataIds = $dataIds;
    $this->format = $reportFormat;
  }

  abstract public function generate(bool $useNewVersion = false): bool;

  public function getWorkspaceId(): int {
    return $this->workspaceId;
  }

  public function getDataIds(): array {
    return $this->dataIds;
  }

  public function getFormat(): ReportFormat {
    return $this->format;
  }

  public function setAdminDAOInstance(AdminDAO $adminDAO): void {
    if (!isset($this->adminDAO)) {
      $this->adminDAO = $adminDAO;
    }
  }

  public function setSysChecksFolderInstance(SysChecksFolder $sysChecksFolder): void {
    if (!isset($this->sysChecksFolder)) {
      $this->sysChecksFolder = $sysChecksFolder;
    }
  }

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
}
