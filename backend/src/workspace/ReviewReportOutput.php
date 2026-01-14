<?php

declare(strict_types=1);

class ReviewReportOutput extends Report {

  public function generate(bool $useNewVersion = false): bool {
    $this->useNewVersion = $useNewVersion;

    $adminDAO = new AdminDAO();
    $reviewData = $adminDAO->getReviewReportData($this->workspaceId, $this->dataIds);
    $reviewData = ReviewCSVFormatter::transformReviewData($reviewData, $useNewVersion, $this->format);
    if ($this->useNewVersion) {
      $reviewData = ReviewCSVFormatter::enrichWithLabels($reviewData, $this->workspaceId);
    }

    if (empty($reviewData)) {
      return false;

    } else {
      $this->reportData = $reviewData;

      if ($this->format == ReportFormat::CSV) {
        $this->csvReportData = ReviewCSVFormatter::generateCsvReportData($reviewData);
      }
    }

    return true;
  }

}