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

  static function getElements(Request $request, array $requiredElements2defaults = [], array $optionalElements = []): array {
    $requestBody = JSON::decode($request->getBody()->getContents());
    return array_merge(
      self::applyDefaultsToRequiredElements($requestBody, $requiredElements2defaults),
      self::setOptionalElements($requestBody, $optionalElements)
    );
  }

  static private function applyDefaultsToRequiredElements($element, array $elements2defaults): array {
    $elements = [];

    foreach ($elements2defaults as $elementName => $default) {
      if (!isset($element->$elementName) and ($default === null)) {
        throw new HttpError("Required body-parameter is missing: `$elementName`", 400);
      }

      $elements[$elementName] = isset($element->$elementName) ? $element->$elementName : $default;
    }

    return $elements;
  }

  // TODO Unit Test
  static function getElementsArray(Request $request, array $elements2defaults = []): array {
    $requestBody = JSON::decode($request->getBody()->getContents());

    if (!is_array($requestBody)) {
      throw new HttpBadRequestException($request, "body has to be an array");
    }

    $result = [];

    foreach ($requestBody as $row) {
      $result[] = self::applyDefaultsToRequiredElements($row, $elements2defaults);
    }

    return $result;
  }

  private static function setOptionalElements($requestBody, array $optionalElements): array {
    $elements = [];

    foreach ($optionalElements as $element) {
      $elements[$element] = $requestBody->$element ?? null;
    }

    return $elements;
  }
}
