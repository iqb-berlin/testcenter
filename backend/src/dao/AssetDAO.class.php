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
    $previousAsset = null;

    $this->beginTransaction();

    try {
      $previousAsset = $this->getAssetByOriginalName($originalName, true);
      $newId = $this->createAsset(self::temporaryOriginalName(), $storedName);

      if ($previousAsset) {
        $this->_(
          'update asset_assignment set asset_id = :new_id where asset_id = :previous_id',
          [
            ':new_id' => $newId,
            ':previous_id' => $previousAsset['id']
          ]
        );
        $this->deleteAsset((int) $previousAsset['id']);
      }

      $this->_(
        'update assets set original_name = :original_name where id = :id',
        [
          ':original_name' => $originalName,
          ':id' => $newId
        ]
      );

      $this->commitTransaction();
    } catch (Throwable $exception) {
      $this->rollBack();
      throw $exception;
    }

    return [
      'id' => $newId,
      'previousStoredName' => $previousAsset['stored_name'] ?? null
    ];
  }

  public function deleteAsset(int $id): void {
    $this->_('delete from assets where id = :id', [':id' => $id]);
  }

  /**
   * @return array<int, array{slot_name: string, scope: string, scope_id: string, asset_id: int, stored_name: string}>
   */
  public function getAssignments(): array {
    return $this->_(
      'select a_a.slot_name, a_a.scope, a_a.scope_id, a_a.asset_id, a.stored_name
         from asset_assignment a_a
         join assets a on a.id = a_a.asset_id',
      [],
      true
    );
  }

  /**
   * @param array<int, array{slotName: string, assetId: int, scope: string, scopeId: string}> $assignments
   */
  public function upsertAssignments(array $assignments): void {
    if (empty($assignments)) {
      return;
    }

    $placeholders = [];
    $params = [];

    foreach ($assignments as $index => $assignment) {
      $placeholders[] = "(:slot{$index}, :asset{$index}, :scope{$index}, :scopeId{$index})";

      $params[":slot{$index}"] = $assignment['slotName'];
      $params[":asset{$index}"] = $assignment['assetId'];
      $params[":scope{$index}"] = $assignment['scope'];
      $params[":scopeId{$index}"] = $assignment['scopeId'];
    }

    $sql = 'insert into asset_assignment (slot_name, asset_id, scope, scope_id) values '
      . implode(', ', $placeholders)
      . ' on duplicate key update asset_id = values(asset_id)';

    $this->_($sql, $params);
  }

  /**
   * @param array<int, array{slotName: string, scope: string, scopeId: string}> $assignments
   */
  public function deleteAssignments(array $assignments): void {
    if (empty($assignments)) {
      return;
    }

    $placeholders = [];
    $params = [];

    foreach ($assignments as $index => $assignment) {
      $placeholders[] = "(:slot{$index}, :scope{$index}, :scopeId{$index})";

      $params[":slot{$index}"] = $assignment['slotName'];
      $params[":scope{$index}"] = $assignment['scope'];
      $params[":scopeId{$index}"] = $assignment['scopeId'];
    }

    $sql = 'delete from asset_assignment where (slot_name, scope, scope_id) in ('
      . implode(', ', $placeholders)
      . ')';

    $this->_($sql, $params);
  }

  private static function temporaryOriginalName(): string {
    return sprintf('__pending_asset_%s', bin2hex(random_bytes(16)));
  }
}
