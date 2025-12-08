<?php

/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

// TODO unit test

use Slim\Exception\HttpBadRequestException;
use Slim\Http\ServerRequest as Request;

class RequestBodyParser {
  static function getRequiredField(Request $request, string $elementName) {
    $requestBody = JSON::decode($request->getBody()->getContents());

    if (!isset($requestBody->$elementName)) {
      throw new HttpBadRequestException($request, "Required body-parameter is missing: `$elementName`");
    }

    return $requestBody->$elementName;
  }

  static function getFieldWithDefault(Request $request, string $elementName, $default) {
    $requestBody = JSON::decode($request->getBody()->getContents());

    return isset($requestBody->$elementName) ? $requestBody->$elementName : $default;
  }

  static function getFields(Request $request, array $requiredElements2defaults = []): array {
    $requestBody = JSON::decode($request->getBody()->getContents());
    return self::extractFields($requestBody, $requiredElements2defaults);
  }

  /**
   * @param $fieldset
   * @param array $fields2defaults this array shows which fields are required to be present and which will be mapped with a
   * default value. The structure is: ['fieldname' => 'defaultvalue', ...]. If the value in this array is 'REQUIRED', the field
   * is required and cannot be mapped with a default value. For every other value the field will be mapped with the
   * given default value, if the field is not present in the request body.
   * @return array
   * @throws HttpError
   */
  static private function extractFields($fieldset, array $fields2defaults): array {
    $fields = [];

    foreach ($fields2defaults as $field => $default) {
      if (!isset($fieldset->$field) and ($default === 'REQUIRED')) {
        throw new HttpError("Required body-parameter is missing: `$field`", 400);
      }

      $fields[$field] = $fieldset->$field ?? $default;
    }

    return $fields;
  }

  // TODO Unit Test
  static function getArrayOfFieldsets(Request $request, array $fields2defaults = [], mixed $getOnlyThisKey = null): array {
    $requestBody = JSON::decode($request->getBody()->getContents());
    $requestBody = !is_null($getOnlyThisKey) ? $requestBody->$getOnlyThisKey : $requestBody;

    if (!is_array($requestBody)) {
      throw new HttpBadRequestException($request, "body has to be an array");
    }

    $result = [];

    foreach ($requestBody as $row) {
      $result[] = self::extractFields($row, $fields2defaults);
    }

    return $result;
  }
}
