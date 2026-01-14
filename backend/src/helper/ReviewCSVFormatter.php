<?php

declare(strict_types=1);

class ReviewCSVFormatter
{
  /**
   * Enriches review data with unit and booklet labels by parsing booklet XML files.
   * @param array $reviewData Raw review data from DAO
   * @param int $workspaceId Workspace ID to load booklet files from
   * @return array Review data with added 'unitlabel' and 'bookletlabel' fields
   */
  public static function enrichWithLabels(array $reviewData, int $workspaceId): array {
    if (empty($reviewData)) {
      return $reviewData;
    }

    $workspace = new Workspace($workspaceId);
    $labelCache = []; // [bookletFileId => ['bookletLabel' => string, 'unitLabels' => [alias => label]]]

    foreach ($reviewData as &$review) {
      $bookletName = $review['bookletname'] ?? '';
      if (!$bookletName) {
        $review['unitlabel'] = '';
        $review['bookletlabel'] = '';
        continue;
      }

      $testName = TestName::fromString($bookletName);
      $bookletFileId = $testName->bookletFileId;

      if (!isset($labelCache[$bookletFileId])) {
        try {
          /** @var XMLFileBooklet $bookletFile */
          $bookletFile = $workspace->getFileById('Booklet', $bookletFileId);
          $labelCache[$bookletFileId] = [
            'bookletLabel' => $bookletFile->getLabel(),
            'unitLabels' => $bookletFile->getUnitLabelsMap()
          ];
        } catch (Exception) {
          $labelCache[$bookletFileId] = [
            'bookletLabel' => '',
            'unitLabels' => []
          ];
        }
      }

      $unitAlias = $review['unitname'] ?? '';
      $review['unitlabel'] = $labelCache[$bookletFileId]['unitLabels'][$unitAlias] ?? '';
      $review['bookletlabel'] = $labelCache[$bookletFileId]['bookletLabel'];
    }
    unset($review);

    return $reviewData;
  }

  public static function transformReviewData(array $reviewData, bool $useNewVersion = false, ReportFormat $format = ReportFormat::CSV): array {
    $transformedReviewData = [];
    $categoryKeys = self::extractCategoryKeys($reviewData);

    foreach ($reviewData as $review) {
      $offset = array_search('categories', array_keys($review));
      $transformedReview =
        array_slice($review, 0, $offset) +
        self::fillCategories($categoryKeys, explode(" ", trim($review['categories']) ?? ''), $useNewVersion, $format) +
        array_slice($review, $offset + 1, null);

      $transformedReviewData[] = $useNewVersion ?
        self::setFormForV2($transformedReview)
        : self::setFormForV1($transformedReview);
    }

    return $transformedReviewData;
  }

  public static function generateCsvReportData(array $reviewData): string {
    $csv[] = implode(Report::DELIMITER, CSV::collectColumnNamesFromHeterogeneousObjects($reviewData));

    foreach ($reviewData as $review) {
      $csv[] = implode(
        Report::DELIMITER,
        array_map(function ($reviewProperty) {
          if (!isset($reviewProperty)) {
            return $reviewProperty; // null: leave unquoted
          }
          // Wrap the whole value in quotes to make all symbols safe (except "), escape existing quotes by doubling them (extra step)
          $escaped = str_replace('"', '""', (string)$reviewProperty);
          return sprintf(Report::CSV_CELL_FORMAT, $escaped);
        }, $review)
      );
    }

    $csv = implode(Report::LINE_ENDING, $csv);

    return Report::BOM . $csv;
  }

  private static function extractCategoryKeys(array $reviewData): array {
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

  private static function fillCategories(
    array $categoryKeys,
    array $categoryValues,
    bool $useNewVersion = false,
    ReportFormat $format = ReportFormat::CSV)
  : array
  {
    $categories = [];

    foreach ($categoryKeys as $categoryKey) {
      $isMatch = false;

      foreach ($categoryValues as $categoryValue) {
        if ($categoryKey === $categoryValue) {
          $isMatch = true;
          break;
        }
      }
      if ($useNewVersion) {
        if ($format == ReportFormat::CSV) {
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

  private static function setFormForV1(array $reviewData): array {
    unset($reviewData['reviewer']);
    return $reviewData;
  }

  private static function setFormForV2(array $reviewData): array {
    $entryCopy = $reviewData['entry'];
    unset($reviewData['entry']);
    $reviewData['entry'] = $entryCopy;

    return $reviewData;
  }
}
