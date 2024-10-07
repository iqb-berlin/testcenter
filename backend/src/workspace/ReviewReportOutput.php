<?php

declare(strict_types=1);

class ReviewReportOutput extends Report {

  public function generate(bool $useNewVersion = false): bool {
    $this->useNewVersion = $useNewVersion;

    $adminDAO = new AdminDAO();
    $reviewData = $adminDAO->getReviewReportData($this->workspaceId, $this->dataIds);
    $reviewData = $this->transformReviewData($reviewData);

    if (empty($reviewData)) {
      return false;

    } else {
      $this->reportData = $reviewData;

      if ($this->format == ReportFormat::CSV) {
        $this->csvReportData = $this->generateCsvReportData($reviewData);
      }
    }

    return true;
  }

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

  private function generateCsvReportData(array $reviewData): string {
    $csv[] = implode(
      self::DELIMITER,
      CSV::collectColumnNamesFromHeterogeneousObjects($reviewData)
    );   // TODO: Adjust column headers?

    foreach ($reviewData as $review) {
      $csv[] = implode(
        self::DELIMITER,
        array_map(
          function ($reviewProperty) {
            return isset($reviewProperty) ? sprintf(self::CSV_CELL_FORMAT, $reviewProperty) : $reviewProperty;
          },
          $review
        )
      );
    }

    $csv = implode(self::LINE_ENDING, $csv);

    return self::BOM . $csv;
  }
}