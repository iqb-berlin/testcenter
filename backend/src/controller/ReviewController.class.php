<?php

declare(strict_types=1);

use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpException;
use Slim\Exception\HttpUnauthorizedException;
use Slim\Http\Response;
use Slim\Http\ServerRequest as Request;

class ReviewController extends Controller
{

  public static function getAllReviewsFromPersonExport(Request $request, Response $response): Response {
    $authToken = self::authToken($request);
    $personId = RequestHelper::getPersonIdFromRequest($request);
    $workspaceId = $authToken->getWorkspaceId();

    $reviewData = self::reviewDAO()->getAllReviewsByPerson($personId);

    $acceptHeader = $request->getHeaderLine('Accept');
    $isJson = str_contains($acceptHeader, 'application/json');

    if ($isJson) {
      // Return as JSON
      $transformedData = ReviewCSVFormatter::transformReviewData($reviewData, true, ReportFormat::JSON);
      $transformedData = ReviewCSVFormatter::enrichWithLabels($transformedData, $workspaceId);
      return $response->withJson($transformedData);

    } else {
      // Return as CSV (default)
      $transformedData = ReviewCSVFormatter::transformReviewData($reviewData, true, ReportFormat::CSV);
      $transformedData = ReviewCSVFormatter::enrichWithLabels($transformedData, $workspaceId);
      $csv = ReviewCSVFormatter::generateCsvReportData($transformedData);

      $bookletName = !empty($reviewData) ? $reviewData[0]['bookletname'] : 'reviews';
      $filename = "reviews-{$bookletName}-" . date('Y-m-d') . ".csv";

      return $response
        ->withHeader('Content-Type', 'text/csv;charset=UTF-8')
        ->withHeader('Content-Disposition', "attachment; filename=\"{$filename}\"")
        ->write($csv);
    }
  }

}