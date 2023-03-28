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

  static function getElements(Request $request, array $elements2defaults = []): array {
    $requestBody = JSON::decode($request->getBody()->getContents());
    return self::applyDefaults($requestBody, $elements2defaults);
  }

  static private function applyDefaults($element, array $elements2defaults) {
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
      $result[] = self::applyDefaults($row, $elements2defaults);
    }

    return $result;
  }
}
