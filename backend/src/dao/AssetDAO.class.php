<?php

declare(strict_types=1);

class AssetDAO extends DAO {
  /**
   * @return array<int, array{id: int, original_name: string, stored_name: string, created_at: string}>
   */
  public function getAllAssets(): array {
    return $this->_(
      'select id, original_name, stored_name, created_at
         from assets
         order by created_at desc',
      [],
      true
    );
  }

  /**
   * @return array{id: int, original_name: string, stored_name: string, created_at: string}|null
   */
  public function getAsset(int $id): ?array {
    return $this->_(
      'select id, original_name, stored_name, created_at from assets where id = :id',
      [':id' => $id]
    );
  }

  /**
   * @return array{id: int, original_name: string, stored_name: string, created_at: string}|null
   */
  public function getAssetByOriginalName(string $originalName, bool $forUpdate = false): ?array {
    return $this->_(
      'select id, original_name, stored_name, created_at
         from assets
        where original_name = :original_name
        order by id desc
        limit 1' . ($forUpdate ? ' for update' : ''),
      [':original_name' => $originalName]
    );
  }

  public function createAsset(string $originalName, string $storedName): int {
    return $this->insert(
      'insert into assets (original_name, stored_name) values (:original_name, :stored_name)',
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
    $this->_('delete from assets where id = :id', [':id' => $id]);
  }

  /**
   * @return array<int, array{workspace_id: int, source: string|null, slot_name: string, scope: string, scope_id: string, asset_id: int, stored_name: string}>
   */
  public function getAssignments(): array {
    return $this->_(
      'select a_a.workspace_id, a_a.source, a_a.slot_name, a_a.scope, a_a.scope_id, a_a.asset_id, a.stored_name
         from asset_assignment a_a
         join assets a on a.id = a_a.asset_id',
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
      $conditions[] = "(a_a.workspace_id = :group_workspace_id and a_a.scope = 'group' and a_a.scope_id = :group_name)";
      $params[':group_workspace_id'] = $workspaceId;
      $params[':group_name'] = $groupName;
    }

    // 3) get user assignment if caller is matching user
    if ($workspaceId !== null && $loginName !== null) {
      $conditions[] = "(a_a.workspace_id = :login_workspace_id and a_a.scope = 'user' and a_a.scope_id = :login_name)";
      $params[':login_workspace_id'] = $workspaceId;
      $params[':login_name'] = $loginName;
    }

    return $this->_(
      'select a_a.workspace_id, a_a.source, a_a.slot_name, a_a.scope, a_a.scope_id, a_a.asset_id, a.stored_name
         from asset_assignment a_a
         join assets a on a.id = a_a.asset_id
        where ' . implode(' or ', $conditions) . '
        order by case a_a.scope
                   when \'global\' then 1
                   when \'group\' then 2
                   when \'user\' then 3
                 end,
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

    $sql = 'insert into asset_assignment (workspace_id, source, slot_name, asset_id, scope, scope_id) values '
      . implode(', ', $placeholders)
      . ' on duplicate key update asset_id = values(asset_id), source = values(source)';

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

    $sql = 'delete from asset_assignment where (workspace_id, slot_name, scope, scope_id) in ('
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
      'delete from asset_assignment where workspace_id = :workspace_id and source = :source',
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
      'select id, original_name from assets where original_name in (' . implode(', ', $placeholders) . ')',
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
