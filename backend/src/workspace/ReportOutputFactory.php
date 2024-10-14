<?php

declare(strict_types=1);

class ReportOutputFactory
{
  public static function createReportOutput(
    int $workspaceId,
    array $dataIds,
    ReportType $reportType,
    ReportFormat $reportFormat
  ): LogReportOutput | ResponseReportOutput | ReviewReportOutput | SysCheckReportOutput {
    // TODO this union type instead of Report is used to satisfy mockery. Could not make it work to mock the child classes
    // of this factory, that can dont need to be mocked in all their methods and at the same inherit the Report class
    return match ($reportType) {
      ReportType::LOG => new LogReportOutput($workspaceId, $dataIds, $reportFormat),
      ReportType::RESPONSE => new ResponseReportOutput($workspaceId, $dataIds, $reportFormat),
      ReportType::REVIEW => new ReviewReportOutput($workspaceId, $dataIds, $reportFormat),
      ReportType::SYSCHECK => new SysCheckReportOutput($workspaceId, $dataIds, $reportFormat),
    };
  }
}