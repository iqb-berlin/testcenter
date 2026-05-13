<?php

declare(strict_types=1);

class AssetDAO extends DAO {
  /**
   * @return array<int, array{id: int, original_name: string, stored_name: string, created_at: string}>
   */
  public function getAllAssets(): array {
    return $this->_(
      "SELECT id, original_name, stored_name, created_at
         FROM assets
         ORDER BY created_at DESC",
      [],
      true
    );
  }

  /**
   * @return array{id: int, original_name: string, stored_name: string, created_at: string}|null
   */
  public function getAsset(int $id): ?array {
    $row = $this->_(
      "SELECT id, original_name, stored_name, created_at FROM assets WHERE id = :id",
      [':id' => $id]
    );
    return $row ?: null;
  }

  public function createAsset(string $originalName, string $storedName): int {
    return $this->insert(
      "INSERT INTO assets (original_name, stored_name)
         VALUES (:original_name, :stored_name)",
      [
        ':original_name' => $originalName,
        ':stored_name' => $storedName
      ]
    );
  }

  public function deleteAsset(int $id): void {
    $this->_("DELETE FROM assets WHERE id = :id", [':id' => $id]);
  }

  /**
   * @return array<int, array{slot_name: string, scope: string, scope_id: string, asset_id: int, stored_name: string}>
   */
  public function getAssignments(): array {
    return $this->_(
      "SELECT a_a.slot_name, a_a.scope, a_a.scope_id, a_a.asset_id, a.stored_name
         FROM asset_assignment a_a
         JOIN assets a ON a.id = a_a.asset_id",
      [],
      true
    );
  }

  public function upsertAssignment(string $slotName, int $assetId, string $scope, string $scopeId): void {
    $this->_(
      "INSERT INTO asset_assignment (slot_name, asset_id, scope, scope_id)
         VALUES (:slot, :asset, :scope, :scope_id)
         ON DUPLICATE KEY UPDATE asset_id = :asset",
      [
        ':slot' => $slotName,
        ':asset' => $assetId,
        ':scope' => $scope,
        ':scope_id' => $scopeId
      ]
    );
  }
}
