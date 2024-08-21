<?php

/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

// TODO unit test

use Slim\Exception\HttpBadRequestException;
use Slim\Http\ServerRequest as Request;

class RequestBodyParser {
  static function getRequiredElement(Request $request, string $elementName) {
    $requestBody = JSON::decode($request->getBody()->getContents());

    if (!isset($requestBody->$elementName)) {
      throw new HttpBadRequestException($request, "Required body-parameter is missing: `$elementName`");
    }

    return $requestBody->$elementName;
  }

  static function getElementWithDefault(Request $request, string $elementName, $default) {
    $requestBody = JSON::decode($request->getBody()->getContents());

    return isset($requestBody->$elementName) ? $requestBody->$elementName : $default;
  }

  static function getElementsFromRequest(Request $request, array $requiredElements2defaults = []): array {
    $requestBody = JSON::decode($request->getBody()->getContents());
    return self::applyDefaultsIfNotRequired($requestBody, $requiredElements2defaults);
  }

  /**
   * @param $elementObject
   * @param array $elements2defaults this array shows which elements are required to be present and which will be mapped with a
   * default value. The structure is: ['element' => 'default', ...]. If the value is the string 'REQUIRED' the element
   * is required and cannot be mapped with a default value. For every other value the element will be mapped with the
   * given default value, if the element is not present in the request body.
   * @return array
   * @throws HttpError
   */
  static private function applyDefaultsIfNotRequired($elementObject, array $elements2defaults): array {
    $elements = [];

    foreach ($elements2defaults as $element => $default) {
      if (!isset($elementObject->$element) and ($default === 'REQUIRED')) {
        throw new HttpError("Required body-parameter is missing: `$element`", 400);
      }

      $elements[$element] = $elementObject->$element ?? $default;
    }

    return $elements;
  }

  // TODO Unit Test
  static function getElementsFromArray(Request $request, array $elements2defaults = [], mixed $getOnlyThisKey = null): array {
    $requestBody = JSON::decode($request->getBody()->getContents());
    $requestBody = !is_null($getOnlyThisKey) ? $requestBody->$getOnlyThisKey : $requestBody;

    if (!is_array($requestBody)) {
      throw new HttpBadRequestException($request, "body has to be an array");
    }

    $result = [];

    foreach ($requestBody as $row) {
      $result[] = self::applyDefaultsIfNotRequired($row, $elements2defaults);
    }

    return $result;
  }
}
