<?php

declare(strict_types=1);

use Slim\Http\Response;
use Slim\Http\ServerRequest as Request;

class AssetAssignmentController extends Controller {
  public function get(Request $request, Response $response): Response {
    $dao = new DAO();

    $params = $request->getQueryParams();
    $group = $params['group'] ?? null;
    $user  = $params['user'] ?? null;

    $rows = $dao->_("
        SELECT ui.slot_name, ui.scope, ui.scope_id, ui.asset_id, a.url
        FROM asset_assignment ui
        JOIN assets a ON a.id = ui.asset_id
    ", [], true);

    $result = [];
    foreach ($rows as $row) {
      $key = $row['slot_name'];

      // GLOBAL (lowest priority)
      if ($row['scope'] === 'global') {
        if (!isset($result[$key])) {
          $result[$key] = [
            'assetID' => $row['asset_id'],
            'url' => $row['url'],
          ];
        }
      }

      // GROUP override
      if ($group !== null &&
        $row['scope'] === 'group' &&
        $row['scope_id'] == $group) {

        $result[$key] = [
          'assetID' => $row['asset_id'],
          'url' => $row['url'],
        ];
      }

      // USER override (highest priority)
      if ($user !== null &&
        $row['scope'] === 'user' &&
        $row['scope_id'] == $user) {
        $result[$key] = [
          'assetID' => $row['asset_id'],
          'url' => $row['url'],
        ];
        }
    }

    $response->getBody()->write(json_encode($result));
    return $response->withHeader('Content-Type', 'application/json');
  }

  public function set(Request $request, Response $response): Response {
    $dao = new DAO();
    $requestData = json_decode($request->getBody()->getContents(), true);

    $assignments = $requestData['assignments'] ?? [];

    foreach ($assignments as $assignment) {
      $slotName = $assignment['slotName'];
      $assetID = $assignment['assetID'];
      $scope = $assignment['scope'] ?? 'global';
      $scopeID   = $assignment['scopeID'] ?? 'global';

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