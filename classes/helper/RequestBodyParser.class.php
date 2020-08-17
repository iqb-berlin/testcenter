<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

use Slim\Exception\HttpBadRequestException;
use Slim\Http\Request;

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

    /**
     * @param Request $request
     * @param array $elements2defaults
     * @return array - an array
     *      keys are (root-)elements from body to receive,
     *      values are default values or 0 if element is required
     * @throws HttpBadRequestException
     */
    static function getElements(Request $request, array $elements2defaults = []): array {

        $requestBody = JSON::decode($request->getBody()->getContents());

        $elements = [];

        foreach ($elements2defaults as $elementName => $default) {

            if (!isset($requestBody->$elementName) and ($default === null)) {
                throw new HttpBadRequestException($request, "Required body-parameter is missing: `$elementName`");
            }

            $elements[$elementName] = isset($requestBody->$elementName) ? $requestBody->$elementName : $default;
        }

        return $elements;
    }
}
