<?php

declare(strict_types=1);

use Slim\Http\Response;
use Slim\Http\ServerRequest as Request;

class AssetAssignmentController extends Controller {
  public static function get(Request $request, Response $response): Response {
    $context = self::resolveContext($request);

    $rows = self::assetDAO()->getAssignmentResolutionRows(
      $context['workspaceId'],
      $context['groupName'],
      $context['loginName']
    );

    $priorities = [
      'global' => 1,
      'group' => 2,
      'user' => 3
    ];
    $slotPriorities = [];

    foreach ($rows as $row) {
      $slotName = $row['slot_name'];
      $priority = $priorities[$row['scope']] ?? 0;
      if (($slotPriorities[$slotName] ?? 0) > $priority) {
        continue;
      }

      $slotPriorities[$slotName] = $priority;
      $result[$row['slot_name']] = [
        'assetID' => (int) $row['asset_id'],
        'url' => AssetStorage::urlFor($row['stored_name']),
      ];
    }

    // an object even without assignments, which an empty PHP array would not encode to
    return $response->withJson($result ?? new stdClass());
  }

  public static function set(Request $request, Response $response): Response {
    $entries = json_decode($request->getBody()->getContents(), true)['assignments'] ?? null;
    if (!is_array($entries) || !array_is_list($entries)) {
      throw new HttpError('Body must contain `assignments` as an array', 400);
    }

    // keyed by slot name, so the last entry for a slot wins
    $toUpsert = [];
    $toDelete = [];
    foreach ($entries as $entry) {
      $slotName = $entry['slotName'] ?? null;
      // the slot names are defined by the frontend; `asset_assignment.slot_name` holds 100 characters
      if (!is_string($slotName) || $slotName === '' || mb_strlen($slotName) > 100
        || !array_key_exists('assetID', (array) $entry)
        || !(is_int($entry['assetID']) || $entry['assetID'] === null)) {
        throw new HttpError('Each assignment needs `slotName` (1–100 characters) and `assetID` (integer or null)', 400);
      }

      $key = [
        'slotName' => $slotName,
        'scope' => 'global',
        'scopeId' => 'global',
        'workspaceId' => 0
      ];

      unset($toUpsert[$slotName], $toDelete[$slotName]);
      if ($entry['assetID'] === null) {
        $toDelete[$slotName] = $key;
        continue;
      }

      $toUpsert[$slotName] = $key + ['assetId' => $entry['assetID']];
    }

    // in one transaction, so a failing write leaves every slot as it was
    self::assetDAO()->transactional(static function() use ($toDelete, $toUpsert): void {
      $missingAssetIds = self::assetDAO()->findMissingAssetIds(array_column($toUpsert, 'assetId'));
      if ($missingAssetIds) {
        throw new HttpError('No asset with the id(s) ' . implode(', ', $missingAssetIds), 400);
      }

      self::assetDAO()->deleteAssignments(array_values($toDelete));
      self::assetDAO()->upsertAssignments(array_values($toUpsert));
    });

    return $response->withJson(['status' => 'ok']);
  }

  /**
   * @return array{workspaceId: int|null, groupName: string|null, loginName: string|null}
   */
  private static function resolveContext(Request $request): array {
    $authToken = $request->getAttribute('AuthToken');

    if (!$authToken instanceof AuthToken || $authToken->getType() === 'admin') {
      return [
        'workspaceId' => null,
        'groupName' => null,
        'loginName' => null
      ];
    }

    if ($authToken->getType() === 'login') {
      $loginSession = self::sessionDAO()->getLoginSessionByToken($authToken->getToken());
      return [
        'workspaceId' => $loginSession->getLogin()->getWorkspaceId(),
        'groupName' => $loginSession->getLogin()->getGroupName(),
        'loginName' => $loginSession->getLogin()->getName()
      ];
    }

    $personSession = self::sessionDAO()->getPersonSessionByToken($authToken->getToken());
    $login = $personSession->getLoginSession()->getLogin();

    return [
      'workspaceId' => $login->getWorkspaceId(),
      'groupName' => $login->getGroupName(),
      'loginName' => $login->getName()
    ];
  }
}
