<?php

declare(strict_types=1);

class ReviewCSVFormatter
{

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
        self::returnArrayWithSeperateEntry($transformedReview)
        : $transformedReview;
    }

    return $transformedReviewData;
  }

  public static function generateCsvReportData(array $reviewData): string {
    $csv[] = implode(Report::DELIMITER, CSV::collectColumnNamesFromHeterogeneousObjects($reviewData));   // TODO: Adjust column headers?

    foreach ($reviewData as $review) {
      $csv[] = implode(
        Report::DELIMITER,
        array_map(function ($reviewProperty) {
          return isset($reviewProperty) ? sprintf(Report::CSV_CELL_FORMAT, $reviewProperty) : $reviewProperty;
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

  private static function returnArrayWithSeperateEntry(array $reviewData): array {
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