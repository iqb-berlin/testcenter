<?php

declare(strict_types=1);

use Slim\Http\Response;
use Slim\Http\ServerRequest as Request;

// TODO hier kann der asset name mitgeliefert werden, sodass das frontend sich den
// extra lookup sparen könnte.
class AssetAssignmentController extends Controller {
  public function get(Request $request, Response $response): Response {
    $dao = new DAO();

    $params = $request->getQueryParams();
    $group = $params['group'] ?? null;
    $user  = $params['user'] ?? null;

    $rows = $dao->_("
        SELECT a_a.slot_name, a_a.scope, a_a.scope_id, a_a.asset_id, a.stored_name
        FROM asset_assignment a_a
        JOIN assets a ON a.id = a_a.asset_id
    ", [], true);

    $result = [];
    foreach ($rows as $row) {
      $key = $row['slot_name'];
      $entry = [
        'assetID' => $row['asset_id'],
        'url' => FileService::urlFor($row['stored_name']),
      ];

      // GLOBAL (lowest priority)
      if ($row['scope'] === 'global') {
        if (!isset($result[$key])) {
          $result[$key] = $entry;
        }
      }

      // GROUP override
      if ($group !== null &&
        $row['scope'] === 'group' &&
        $row['scope_id'] == $group) {
        $result[$key] = $entry;
      }

      // USER override (highest priority)
      if ($user !== null &&
        $row['scope'] === 'user' &&
        $row['scope_id'] == $user) {
        $result[$key] = $entry;
      }
    }

    $response->getBody()->write(json_encode($result));
    return $response->withHeader('Content-Type', 'application/json');
  }

  public function set(Request $request, Response $response): Response {
    $dao = new DAO();
    $requestData = json_decode($request->getBody()->getContents(), true);

    $assignments = $requestData['assignments'] ?? [];

    // TODO n+1 das kann zusammengefasst werden, sodass nur 1 DB-Call gemacht wird
    foreach ($assignments as $assignment) {
      $slotName = $assignment['slotName'];
      $assetID = $assignment['assetID'];
      $scope = $assignment['scope'] ?? 'global';
      $scopeID = $assignment['scopeID'] ?? 'global';

      $dao->_("
          INSERT INTO asset_assignment (slot_name, asset_id, scope, scope_id)
          VALUES (:slot, :asset, :type, :id)
          ON DUPLICATE KEY UPDATE asset_id = :asset
      ", [
        ':slot'  => $slotName,
        ':asset' => $assetID,
        ':type'  => $scope,
        ':id'    => $scopeID
      ]);
    }

    $response->getBody()->write(json_encode([
      "status" => "ok"
    ]));
    return $response->withHeader('Content-Type', 'application/json');
  }
}