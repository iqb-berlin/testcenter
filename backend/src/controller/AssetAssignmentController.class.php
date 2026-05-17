<?php

declare(strict_types=1);

use Slim\Http\Response;
use Slim\Http\ServerRequest as Request;

// TODO hier kann der asset name mitgeliefert werden, sodass das frontend sich den
// extra lookup sparen könnte.
class AssetAssignmentController extends Controller {
  private const DEFAULT_ASSIGNMENTS = [
    'logo' => [
      'assetID' => null,
      'url' => 'assets/IQB-Logo-2025.png'
    ],
    'loginIllustration' => [
      'assetID' => null,
      'url' => 'assets/login-illustration.png'
    ],
    'loginCompanion' => [
      'assetID' => null,
      'url' => 'assets/images/bird-character.png'
    ]
  ];

  public static function get(Request $request, Response $response): Response {
    $context = self::resolveContext($request);

    $rows = self::assetDAO()->getAssignmentResolutionRows(
      $context['workspaceId'],
      $context['groupName'],
      $context['loginName']
    );

    $result = self::DEFAULT_ASSIGNMENTS;
    foreach ($rows as $row) {
      $result[$row['slot_name']] = [
        'assetID' => (int) $row['asset_id'],
        'url' => AssetStorage::urlFor($row['stored_name']),
      ];
    }

    return $response->withJson($result);
  }

  public static function set(Request $request, Response $response): Response {
    $requestData = json_decode($request->getBody()->getContents(), true);
    $payload = $requestData['assignments'] ?? [];

    $toUpsert = [];
    $toDelete = [];
    foreach ($payload as $a) {
      $key = [
        'slotName' => $a['slotName'],
        'scope' => 'global',
        'scopeId' => 'global',
        'workspaceId' => 0
      ];

      if ($a['assetID'] === null) {
        $toDelete[] = $key;
        continue;
      }

      $toUpsert[] = $key + ['assetId' => (int) $a['assetID']];
    }

    self::assetDAO()->deleteAssignments($toDelete);
    self::assetDAO()->upsertAssignments($toUpsert);

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
