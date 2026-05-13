<?php

declare(strict_types=1);

use Slim\Http\Response;
use Slim\Http\ServerRequest as Request;

// TODO hier kann der asset name mitgeliefert werden, sodass das frontend sich den
// extra lookup sparen könnte.
class AssetAssignmentController extends Controller {
  public static function get(Request $request, Response $response): Response {
    $params = $request->getQueryParams();
    $group = $params['group'] ?? null;
    $user = $params['user'] ?? null;

    $rows = self::assetDAO()->getAssignments();

    $result = [];
    foreach ($rows as $row) {
      $key = $row['slot_name'];
      $entry = [
        'assetID' => $row['asset_id'],
        'url' => AssetStorage::urlFor($row['stored_name']),
      ];

      // GLOBAL (lowest priority)
      if ($row['scope'] === 'global') {
        if (!isset($result[$key])) {
          $result[$key] = $entry;
        }
      }

      // GROUP override
      if ($group !== null && $row['scope'] === 'group' && $row['scope_id'] == $group) {
        $result[$key] = $entry;
      }

      // USER override (highest priority)
      if ($user !== null && $row['scope'] === 'user' && $row['scope_id'] == $user) {
        $result[$key] = $entry;
      }
    }

    return $response->withJson($result);
  }

  public static function set(Request $request, Response $response): Response {
    $requestData = json_decode($request->getBody()->getContents(), true);
    $assignments = $requestData['assignments'] ?? [];

    // TODO n+1 das kann zusammengefasst werden, sodass nur 1 DB-Call gemacht wird
    foreach ($assignments as $assignment) {
      self::assetDAO()->upsertAssignment(
        $assignment['slotName'],
        (int) $assignment['assetID'],
        $assignment['scope'] ?? 'global',
        (string) ($assignment['scopeID'] ?? 'global')
      );
    }

    return $response->withJson(['status' => 'ok']);
  }
}
