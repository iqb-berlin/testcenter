<?php

declare(strict_types=1);

class AssetDAO extends DAO {
  /**
   * @return array<int, array{id: int, original_name: string, stored_name: string, created_at: string}>
   */
  public function getAllAssets(): array {
    return $this->_(
      'SELECT id, original_name, stored_name, created_at
         FROM assets
         ORDER BY created_at DESC',
      [],
      true
    );
  }

  /**
   * @return array{id: int, original_name: string, stored_name: string, created_at: string}|null
   */
  public function getAsset(int $id): ?array {
    return $this->_(
      'SELECT id, original_name, stored_name, created_at FROM assets WHERE id = :id',
      [':id' => $id]
    );
  }

  /**
   * @return array{id: int, original_name: string, stored_name: string, created_at: string}|null
   */
  public function getAssetByOriginalName(string $originalName, bool $forUpdate = false): ?array {
    return $this->_(
      'SELECT id, original_name, stored_name, created_at
         FROM assets
        WHERE original_name = :original_name
        ORDER BY id DESC
        LIMIT 1' . ($forUpdate ? ' FOR UPDATE' : ''),
      [':original_name' => $originalName]
    );
  }

  public function createAsset(string $originalName, string $storedName): int {
    return $this->insert(
      'INSERT INTO assets (original_name, stored_name) VALUES (:original_name, :stored_name)',
      [
        ':original_name' => $originalName,
        ':stored_name' => $storedName
      ]
    );
  }

  /**
   * @return array{id: int, previousStoredName: string|null}
   */
  public function replaceAssetByOriginalName(string $originalName, string $storedName): array {
    $this->beginTransaction();

    try {
      $previousAsset = $this->getAssetByOriginalName($originalName, true);

      if ($previousAsset) {
        $assetId = (int) $previousAsset['id'];
        $this->_(
          'UPDATE assets SET stored_name = :stored_name WHERE id = :id',
          [
            ':stored_name' => $storedName,
            ':id' => $assetId
          ]
        );
      } else {
        $assetId = $this->createAsset($originalName, $storedName);
      }

      $this->commitTransaction();
    } catch (Throwable $exception) {
      $this->rollBack();
      throw $exception;
    }

    return [
      'id' => $assetId,
      'previousStoredName' => $previousAsset['stored_name'] ?? null
    ];
  }

  public function deleteAsset(int $id): void {
    $this->_('DELETE FROM assets WHERE id = :id', [':id' => $id]);
  }

  /**
   * @return array<int, array{workspace_id: int, source: string|null, slot_name: string, scope: string, scope_id: string, asset_id: int, stored_name: string}>
   */
  public function getAssignments(): array {
    return $this->_(
      'SELECT a_a.workspace_id, a_a.source, a_a.slot_name, a_a.scope, a_a.scope_id, a_a.asset_id, a.stored_name
         FROM asset_assignment a_a
         JOIN assets a ON a.id = a_a.asset_id',
      [],
      true
    );
  }

  /**
   * Returns the assignments, already resolved according to who is calling the assignments. Pre Login only returns global
   * assignments; logged in users/groups their respective assignments as well
   * @return array<int, array{workspace_id: int, source: string|null, slot_name: string, scope: string, scope_id: string, asset_id: int, stored_name: string}>
   */
  public function getAssignmentResolutionRows(
    ?int $workspaceId = null,
    ?string $groupName = null,
    ?string $loginName = null
  ): array {
    // 1) get all global assignments first for everyone
    $conditions = [
      "(a_a.scope = 'global')"
    ];
    $params = [];

    // 2) get group assignments if caller is matching group
    if ($workspaceId !== null && $groupName !== null) {
      $conditions[] = "(a_a.workspace_id = :group_workspace_id AND a_a.scope = 'group' AND a_a.scope_id = :group_name)";
      $params[':group_workspace_id'] = $workspaceId;
      $params[':group_name'] = $groupName;
    }

    // 3) get user assignment if caller is matching user
    if ($workspaceId !== null && $loginName !== null) {
      $conditions[] = "(a_a.workspace_id = :login_workspace_id AND a_a.scope = 'user' AND a_a.scope_id = :login_name)";
      $params[':login_workspace_id'] = $workspaceId;
      $params[':login_name'] = $loginName;
    }

    return $this->_(
      'SELECT a_a.workspace_id, a_a.source, a_a.slot_name, a_a.scope, a_a.scope_id, a_a.asset_id, a.stored_name
         FROM asset_assignment a_a
         JOIN assets a ON a.id = a_a.asset_id
        WHERE ' . implode(' OR ', $conditions) . '
        ORDER BY CASE a_a.scope
                   WHEN \'global\' THEN 1
                   WHEN \'group\' THEN 2
                   WHEN \'user\' THEN 3
                 END,
                 a_a.slot_name',
      $params,
      true
    );
  }

  /**
   * @param array<int, array{slotName: string, assetId: int, scope: string, scopeId: string, workspaceId?: int, source?: string|null}> $assignments
   */
  public function upsertAssignments(array $assignments): void {
    if (empty($assignments)) {
      return;
    }

    $placeholders = [];
    $params = [];

    foreach ($assignments as $index => $assignment) {
      $placeholders[] = "(:workspaceId{$index}, :source{$index}, :slot{$index}, :asset{$index}, :scope{$index}, :scopeId{$index})";

      $params[":workspaceId{$index}"] = $assignment['workspaceId'] ?? 0;
      $params[":source{$index}"] = $assignment['source'] ?? null;
      $params[":slot{$index}"] = $assignment['slotName'];
      $params[":asset{$index}"] = $assignment['assetId'];
      $params[":scope{$index}"] = $assignment['scope'];
      $params[":scopeId{$index}"] = $assignment['scopeId'];
    }

    $sql = 'INSERT INTO asset_assignment (workspace_id, source, slot_name, asset_id, scope, scope_id) VALUES '
      . implode(', ', $placeholders)
      . ' ON DUPLICATE KEY UPDATE asset_id = VALUES(asset_id), source = VALUES(source)';

    $this->_($sql, $params);
  }

  /**
   * @param array<int, array{slotName: string, scope: string, scopeId: string, workspaceId?: int}> $assignments
   */
  public function deleteAssignments(array $assignments): void {
    if (empty($assignments)) {
      return;
    }

    $placeholders = [];
    $params = [];

    foreach ($assignments as $index => $assignment) {
      $placeholders[] = "(:workspaceId{$index}, :slot{$index}, :scope{$index}, :scopeId{$index})";

      $params[":workspaceId{$index}"] = $assignment['workspaceId'] ?? 0;
      $params[":slot{$index}"] = $assignment['slotName'];
      $params[":scope{$index}"] = $assignment['scope'];
      $params[":scopeId{$index}"] = $assignment['scopeId'];
    }

    $sql = 'DELETE FROM asset_assignment WHERE (workspace_id, slot_name, scope, scope_id) IN ('
      . implode(', ', $placeholders)
      . ')';

    $this->_($sql, $params);
  }

  /**
   * @param array<int, array{slotName: string, assetName: string, scope: string, scopeId: string}> $assignments
   * @return array{deleted: int, added: int}
   */
  public function updateXmlAssignments(int $workspaceId, string $source, array $assignments): array {
    $toUpsert = [];

    $this->beginTransaction();

    try {
      $deleted = $this->deleteXmlAssignments($workspaceId, $source);
      $assetIds = $this->getAssetIdsByOriginalNames(
        array_values(array_unique(array_column($assignments, 'assetName')))
      );

      foreach ($assignments as $assignment) {
        $assetName = $assignment['assetName'];

        if (!isset($assetIds[$assetName])) {
          throw new Exception("Asset `$assetName` not found.");
        }

        $toUpsert[] = [
          'workspaceId' => $workspaceId,
          'source' => $source,
          'slotName' => $assignment['slotName'],
          'assetId' => $assetIds[$assetName],
          'scope' => $assignment['scope'],
          'scopeId' => $assignment['scopeId']
        ];
      }

      $this->upsertAssignments($toUpsert);
      $this->commitTransaction();
    } catch (Throwable $exception) {
      $this->rollBack();
      throw $exception;
    }

    return [
      'deleted' => $deleted,
      'added' => count($toUpsert)
    ];
  }

  public function deleteXmlAssignments(int $workspaceId, string $source): int {
    $this->_(
      'DELETE FROM asset_assignment WHERE workspace_id = :workspace_id AND source = :source',
      [
        ':workspace_id' => $workspaceId,
        ':source' => $source
      ]
    );

    return $this->lastAffectedRows ?? 0;
  }

  /**
   * @param string[] $originalNames
   * @return array<string, int>
   */
  private function getAssetIdsByOriginalNames(array $originalNames): array {
    if (empty($originalNames)) {
      return [];
    }

    $placeholders = [];
    $params = [];

    foreach ($originalNames as $index => $originalName) {
      $placeholders[] = ":name{$index}";
      $params[":name{$index}"] = $originalName;
    }

    $rows = $this->_(
      'SELECT id, original_name FROM assets WHERE original_name IN (' . implode(', ', $placeholders) . ')',
      $params,
      true
    );

    $assetIds = [];
    foreach ($rows as $row) {
      $assetIds[$row['original_name']] = (int) $row['id'];
    }

    return $assetIds;
  }

}
