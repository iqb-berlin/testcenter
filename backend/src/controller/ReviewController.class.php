<?php

declare(strict_types=1);

use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpException;
use Slim\Exception\HttpUnauthorizedException;
use Slim\Http\Response;
use Slim\Http\ServerRequest as Request;

class ReviewController extends Controller {

  public static function getAllReviewsFromPersonExport(Request $request, Response $response): Response {
    $authToken = self::authToken($request);
    $personId = $authToken->getId();
    $workspaceId = $authToken->getWorkspaceId();

    $reviewData = self::reviewDAO()->getReviewsByPerson($personId);

    $acceptHeader = $request->getHeaderLine('Accept');
    if (str_contains($acceptHeader, 'application/json')) {
      // Return as JSON
      $transformedData = ReviewCSVFormatter::transformReviewData($reviewData, true, ReportFormat::JSON);
      $transformedData = ReviewCSVFormatter::enrichWithLabels($transformedData, $workspaceId);
      return $response->withJson($transformedData);
    }

    // Return as CSV (default)
    $transformedData = ReviewCSVFormatter::transformReviewData($reviewData, true, ReportFormat::CSV);
    $transformedData = ReviewCSVFormatter::enrichWithLabels($transformedData, $workspaceId);
    $csv = ReviewCSVFormatter::generateCsvReportData($transformedData);

    if ($csv === Report::BOM) {
      return $response->withStatus(204);
    }

    return $response
      ->withHeader('Content-Type', 'text/csv;charset=UTF-8')
      ->write($csv);
  }

}