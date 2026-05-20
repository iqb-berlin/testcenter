<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class WorkspaceDAO extends DAO {
  private int $workspaceId;
  private string $workspacePath;

  public function __construct(int $workspaceId, string $workspacePath) {
    parent::__construct();
    $this->workspaceId = $workspaceId;
    $this->workspacePath = $workspacePath;
  }

  public function getWorkspaceId(): int
  {
    return $this->workspaceId;
  }

  public function getWorkspaceName(): string {
    $workspace = $this->_(
      'SELECT workspaces.name 
            FROM workspaces
            WHERE workspaces.id=:workspace_id',
      [':workspace_id' => $this->workspaceId]
    );

    if ($workspace == null) {
      throw new HttpError("Workspace `$this->workspaceId` not found", 404); // @codeCoverageIgnore
    }

    return $workspace['name'];
  }

  public function getGlobalIds(): array {
    $globalIds = $this->_("
      SELECT
        globalIds.id AS id,
        source,
        workspace_id,
        workspaces.name AS workspace_name,
        globalIds.type AS type
      FROM (
        SELECT name AS id, source, workspace_id, 'login' AS type FROM logins
        UNION
        SELECT group_name AS id, source, workspace_id, 'group' AS type FROM logins GROUP BY group_name, source, workspace_id
      ) AS globalIds
      LEFT JOIN workspaces ON globalIds.workspace_id = workspaces.id
      ",
      [],
      true
    );

    $arr = [];

    foreach ($globalIds as $globalId) {
      $arr[$globalId['workspace_id']][$globalId['source']][$globalId['type']][] = $globalId['id'];
      $arr[$globalId['workspace_id']]['/name/'] = $globalId['workspace_name'];
    }

    return $arr;
  }

  /**
   * @codeCoverageIgnore
   */
  public function updateLoginSource(string $source, LoginArray $logins): array {
    $deleted = $this->deleteLoginSource($source);
    $added = $this->addLoginSource($source, $logins);
    return [$deleted, $added];
  }


  // TODO unit-test
  public function addLoginSource(string $source, LoginArray $logins): int {

    // one source could contain 10ks of logins. For the sake of performance we use one statement to insert them all
    // and plain foreach and string-concatenation to build the query.

    $sql = 'INSERT INTO logins (
      name,
      mode,
      workspace_id,
      codes_to_booklets,
      group_name,
      group_label,
      custom_texts,
      password,
      source,
      valid_from,
      valid_to,
      valid_for,
      monitors,
      view_settings
    ) VALUES';

    foreach ($logins as $login) {
      /* @var $login Login */
      $loginValues = array_map(
        function (string|int|null $v): string|int {
          if ($v == null) return 'null';
          if (is_string($v)) return $this->pdoDBhandle->quote($v);
          return $v;
        },
        [
          $login->getName(),
          $login->getMode(),
          $this->workspaceId,
          json_encode($login->testNames()),
          $login->getGroupName(),
          $login->getGroupLabel(),
          json_encode($login->getCustomTexts()),
          Password::encrypt($login->getPassword(), 't', true),
          $source,
          TimeStamp::toSQLFormat($login->getValidFrom()),
          TimeStamp::toSQLFormat($login->getValidTo()),
          $login->getValidForMinutes(),
          json_encode($login->getProfiles()),
          json_encode($login->getViewSettings())
        ]
      );
      $sql .= '(' . implode(', ', $loginValues) . '),';
    }
    $sql = rtrim($sql, ",");

    $this->_($sql, [], true);

    $this->updateValidUntilInPersonSession();

    return count($logins->asArray());
  }

  /**
   * @codeCoverageIgnore
   */
  public function deleteLoginSource(string $source): int {
    $this->_(
      'DELETE FROM logins WHERE source = :source AND workspace_id = :ws_id',
      [
        ':source' => $source,
        ':ws_id' => $this->workspaceId
      ]
    );
    return $this->lastAffectedRows;
  }

  /**
   * @param array<int, array{slotName: string, assetName: string, scope: string, scopeId: string}> $assignments
   * @return array{deleted: int, added: int}
   */
  public function updateAssetAssignmentSource(string $source, array $assignments): array {
    return (new AssetDAO())->updateXmlAssignments($this->workspaceId, $source, $assignments);
  }

  public function deleteAssetAssignmentSource(string $source): int {
    return (new AssetDAO())->deleteXmlAssignments($this->workspaceId, $source);
  }

  public function storeFile(File $file): void {
    $this->_("REPLACE INTO files (
                    workspace_id,
                    name,
                    id,
                    version_mayor,
                    version_minor,
                    version_patch,
                    version_label,
                    label,
                    description,
                    type,
                    verona_module_type,
                    verona_version,
                    verona_module_id,
                    is_valid,
                    validation_report,
                    size,
                    modification_ts,
                    context_data
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
      [
        $this->workspaceId,
        $file->getName(),
        $file->getId(),
        $file->getVersionMayor(),
        $file->getVersionMinor(),
        $file->getVersionPatch(),
        $file->getVersionLabel(),
        $file->getLabel(),
        $file->getDescription(),
        $file->getType(),
        $file->getVeronaModuleType(),
        $file->getVeronaVersion(),
        $file->getVeronaModuleId(),
        $file->isValid() ? 1 : 0,
        serialize($file->getValidationReport()),
        $file->getSize(),
        TimeStamp::toSQLFormat($file->getModificationTime()),
        serialize($file->getContextData())
      ]
    );
  }

  /**
   * @codeCoverageIgnore
   */
  public function deleteFile(File $file): void {
    $this->_("DELETE FROM files WHERE workspace_id = ? AND name = ? AND type = ?", [$this->workspaceId, $file->getName(), $file->getType()]);
  }

  public function getFileById(string $fileId, string $type): ?File {
    $fileData = $this->_(
      "SELECT
                    name,
                    id,
                    label,
                    type,
                    description,
                    is_valid,
                    validation_report,
                    size,
                    modification_ts,
                    version_mayor,
                    version_minor,
                    version_patch,
                    version_label,
                    verona_module_id,
                    verona_module_type,
                    verona_version,
                    context_data
                FROM
                    files
                WHERE
                    workspace_id = ? AND id = ? AND type = ?",
      [
        $this->workspaceId,
        $fileId,
        $type
      ]
    );

    return $fileData ? $this->resultRow2File($fileData, []) : null;
  }

  public function updateUnitDefsAttachments(string $bookletName, array $attachments): void {
    $this->_(
      'DELETE FROM unit_defs_attachments WHERE workspace_id = :workspace_id AND booklet_name = :booklet_name;',
      [
        ':workspace_id' => $this->workspaceId,
        ':booklet_name' => $bookletName
      ]
    );

    foreach ($attachments as $requestedAttachment) {
      /* @var RequestedAttachment $requestedAttachment */

      $this->_(
        'REPLACE INTO unit_defs_attachments(workspace_id, booklet_name, unit_name, variable_id, attachment_type)
                    VALUES(:workspace_id, :booklet_name, :unit_name, :variable_id, :attachment_type)',
        [
          ':workspace_id' => $this->workspaceId,
          ':booklet_name' => $bookletName,
          ':unit_name' => $requestedAttachment->unitName,
          ':variable_id' => $requestedAttachment->variableId,
          ':attachment_type' => $requestedAttachment->attachmentType
        ]);
    }
  }

  public function getAllFiles(): array {
    $sql = "
            SELECT
                name,
                type,
                id,
                label,
                description,
                is_valid,
                validation_report,
                size,
                modification_ts,
                version_mayor,
                version_minor,
                version_patch,
                version_label,
                verona_module_id,
                verona_module_type,
                verona_version,
                context_data
            FROM files
                WHERE workspace_id = ?";
    $replacements = [$this->workspaceId];

    return $this->fetchFiles($sql, $replacements);
  }

  public function getFilesByNames(array $names): array {
    $sql = "
            SELECT
                name,
                type,
                id,
                label,
                description,
                is_valid,
                validation_report,
                size,
                modification_ts,
                version_mayor,
                version_minor,
                version_patch,
                version_label,
                verona_module_id,
                verona_module_type,
                verona_version,
                context_data
            FROM files
                WHERE workspace_id = ? AND
                name IN (" . implode(',', array_map(fn ($name) => '?', $names)) . ')';

    $replacements = [
      $this->workspaceId,
      ...$names
    ];

    return $this->fetchFiles($sql, $replacements, true);
  }

  /** @param array $conditions list('column' => value)
   * @return array ['filetype' => File[]]*/
  public function getAllFilesWhere(array $conditions): array {
    $sql = "
            SELECT
                name,
                type,
                id,
                label,
                description,
                is_valid,
                validation_report,
                size,
                modification_ts,
                version_mayor,
                version_minor,
                version_patch,
                version_label,
                verona_module_id,
                verona_module_type,
                verona_version,
                context_data
            FROM files
                WHERE workspace_id = ?";
    $replacements = [$this->workspaceId];

    foreach ($conditions as $condition => $value) {
      $sql .= " AND $condition = ?";
      $replacements[] = $value;
    }

    return $this->fetchFiles($sql, $replacements);
  }

  public function getFileRelations(string $name, string $type): array {
    $relations = $this->_("
            SELECT
                object_type,
                object_name,
                relationship_type,
                id AS object_id
            FROM
                file_relations
                LEFT JOIN files
                    ON file_relations.workspace_id = files.workspace_id
                       AND file_relations.object_name = files.name
                       AND file_relations.object_type = files.type
            WHERE
                files.workspace_id = ?
                    AND subject_name = ?
                    AND subject_type = ?",
      [$this->workspaceId, $name, $type],
      true
    );

    return array_map(
      function(array $r): FileRelation {
        return new FileRelation(
          $r['object_type'],
          $r['object_name'],
          constant("FileRelationshipType::{$r['relationship_type']}"),
          null,
          $r['object_id']
        );
      },
      $relations
    );
  }

  public function getFiles(array $localPaths, bool $includeInvalid = false): array {
    $replacements = [$this->workspaceId];
    $validFilePaths = 0;

    foreach ($localPaths as $fileLocalPath) {
      $partParts = explode('/', $fileLocalPath, 2);
      if (count($partParts) == 2) {
        list($replacements[], $replacements[]) = $partParts;
        $validFilePaths++;
      }
    }

    $filePathCondition = implode(' OR ', array_fill(0, $validFilePaths, '(type = ? AND name = ?)'));
    $filePathCondition = $filePathCondition ? "AND ($filePathCondition)" : '';

    $andIsValid = $includeInvalid ? '' : ' AND files.is_valid';

    $sql = "SELECT DISTINCT
                    name,
                    type,
                    id,
                    label,
                    description,
                    is_valid,
                    validation_report,
                    size,
                    modification_ts,
                    version_mayor,
                    version_minor,
                    version_patch,
                    version_label,
                    verona_module_id,
                    verona_module_type,
                    verona_version,
                    context_data
                FROM files
                WHERE
                    files.workspace_id = ?
                    $andIsValid
                    $filePathCondition";

    return $this->fetchFiles($sql, $replacements);
  }

  private function fetchFiles($sql, $replacements, bool $getDependencies = false): array {
    $files = [];
    foreach ($this->_($sql, $replacements, true) as $row) {
      $files[$row['type']] ??= [];
      // $relations = $this->getFileRelations($workspaceId, $row['name'], $row['type']);
      if ($getDependencies) {
        $dependencies = $this->fetchDependenciesForFile($row['name']);
      }
      $files[$row['type']][$row['name']] = $this->resultRow2File($row, $dependencies ?? []);
    }
    return $files;
  }

  private function resultRow2File(array $row, array $relations): ?File {
    return File::get(
      new FileData(
        "$this->workspacePath/{$row['type']}/{$row['name']}",
        $row['type'],
        $row['id'],
        $row['label'],
        $row['description'],
        !!$row['is_valid'],
        unserialize($row['validation_report']),
        $relations,
        TimeStamp::fromSQLFormat($row['modification_ts']),
        $row['size'],
        unserialize($row['context_data']),
        $row['verona_module_type'],
        $row['verona_module_id'],
        $row['version_mayor'],
        $row['version_minor'],
        $row['version_patch'],
        $row['version_label'],
        $row['verona_version']
      ),
      $row['type']
    );
  }

  public function getBlockedFiles(array $files): array {
    if (!count($files)) {
      return [];
    }

    $replacements = [
      ':ws_id' => $this->workspaceId
    ];
    $conditions = [];
    $i = 0;
    foreach ($files as $file) {
      $i++;
      $replacements[":type_$i"] = $file->getType();
      $replacements[":name_$i"] = $file->getName();
      $conditions[] = "(object_type = :type_$i AND object_name = :name_$i)";
    }

    $selectedFilesConditions = implode(' OR ', $conditions);

    $sql = "WITH RECURSIVE affected_files AS (
                    -- base/first case that initializes the recursion
                    SELECT
                        subject_type AS object_type,
                        subject_name AS object_name,
                        object_type || '/' || object_name AS ancestor
                    FROM file_relations
                    WHERE
                        workspace_id = :ws_id AND ($selectedFilesConditions)
                
                    UNION ALL
                
                    -- recursive case
                    SELECT
                        file_relations.subject_type AS object_type,
                        file_relations.subject_name AS object_name,
                        affected_files.ancestor
                    FROM affected_files
                        JOIN file_relations
                            ON affected_files.object_name = file_relations.object_name
                                AND affected_files.object_type = file_relations.object_type
                                AND file_relations.workspace_id = :ws_id
                )
                SELECT DISTINCT
                    affected_files.ancestor AS file_local_path,
                    object_type || '/' || object_name AS blocked_by
                FROM affected_files
                WHERE
                    NOT ($selectedFilesConditions)";

    $result = $this->_($sql, $replacements, true);

    return array_reduce(
      $result,
      function(array $agg, array $row) {
        $agg[$row['file_local_path']] = $row['blocked_by'];
        return $agg;
      },
      []
    );
  }

  public function storeRelations(File $file): array {
    $unresolvedRelations = [];
    $updatedRelations = [];

    foreach ($file->getRelations() as $relation) {
      /* @var $relation FileRelation */

      $relatedFile = $relation->getTarget();

      if (!$relatedFile) {
        $unresolvedRelations++;
      }

      $this->_(
        "REPLACE INTO file_relations (workspace_id, subject_name, subject_type, relationship_type, object_type, object_name)
                VALUES (?, ?, ?, ?, ?, ?);",
        [
          $this->workspaceId,
          $file->getName(),
          $file->getType(),
          $relation->getRelationshipType()->name,
          $relation->getTargetType(),
          $relatedFile->getName()
        ]
      );

      if ($this->lastAffectedRows != 1) {
        $updatedRelations[] = $relation;
      }
    }

    return [$unresolvedRelations, $updatedRelations];
  }

  public function getBookletResourcePaths(string $bookletFileName): array {
      return
        $this->_(
          "SELECT DISTINCT
            unitFiles.id,
            resourceFiles.type,
            resourceFiles.name,
            unitNeedsResource.relationship_type
          FROM file_relations AS bookletContainsUnit
            LEFT JOIN file_relations AS unitNeedsResource
              ON bookletContainsUnit.workspace_id = unitNeedsResource.workspace_id
                AND bookletContainsUnit.object_name = unitNeedsResource.subject_name
                AND bookletContainsUnit.object_type = unitNeedsResource.subject_type
--                and unitNeedsResource.relationship_type in('isDefinedBy', 'usesPlayer')
                AND unitNeedsResource.object_type = 'Resource'
                AND bookletContainsUnit.relationship_type = 'containsUnit'
            LEFT JOIN files AS resourceFiles
              ON resourceFiles.type = unitNeedsResource.object_type
                AND resourceFiles.name = unitNeedsResource.object_name
                AND resourceFiles.workspace_id = unitNeedsResource.workspace_id
            LEFT JOIN files AS unitFiles
              ON unitFiles.type = unitNeedsResource.subject_type
                AND unitFiles.name = unitNeedsResource.subject_name
                AND unitFiles.workspace_id = unitNeedsResource.workspace_id
            WHERE
              bookletContainsUnit.subject_name = :booklet_file_name
              AND resourceFiles.workspace_id = :ws_id
              AND resourceFiles.is_valid = 1",
            [
              ':ws_id' => $this->workspaceId,
              ':booklet_file_name' => $bookletFileName
            ],
          true
        );
    }

  public function getWorkspaceHash(): string
  {
    return $this->_(
      "SELECT workspace_hash FROM workspaces WHERE id = :ws_id",
      [':ws_id' => $this->workspaceId]
    )['workspace_hash'];
  }

  public function setWorkspaceHash(string $hash): void
  {
    $this->_(
      "UPDATE workspaces SET workspace_hash = :hash WHERE id = :ws_id",
      [':hash' => $hash, ':ws_id' => $this->workspaceId]
    );
  }

  private function setSysCheckModeAccordingToTT(LoginArray $logins): void {
    $enableSysCheckMode = SysCheckMode::TEST;
    /** @var Login $login */
    foreach ($logins as $login) {
      if ($login->getMode() == 'sys-check-login') {
        $enableSysCheckMode = SysCheckMode::SYSCHECK;
        break;
      }
    }
    $this->_(
      "UPDATE workspaces SET content_type = '$enableSysCheckMode->value' WHERE id = :ws_id",
      [':ws_id' => $this->workspaceId],
      true
    );
  }

  public function setSysCheckMode(string $mode): void {
    $this->_(
      "UPDATE workspaces SET content_type = :mode WHERE id = :ws_id",
      [
        ':mode' => $mode,
        ':ws_id' => $this->workspaceId
      ],
      true
    );
  }

  public function updateContentTypeBasedOnRemainingTesttakers(): void {
    $allLogins = new LoginArray();
    
    // Get all remaining testtakers files in this workspace
    $testtakersFiles = $this->_(
      "SELECT name FROM files WHERE workspace_id = :ws_id AND type = 'Testtakers' AND is_valid = 1",
      [':ws_id' => $this->workspaceId],
      true
    );
    
    if (!$testtakersFiles) {
      $this->setSysCheckMode('mixed');
      return;
    }
    
    foreach ($testtakersFiles as $fileInfo) {
      try {
        $testtakersFile = new XMLFileTesttakers("$this->workspacePath/Testtakers/{$fileInfo['name']}");
        if ($testtakersFile->isValid()) {
          $fileLogins = $testtakersFile->getAllLogins();
          foreach ($fileLogins as $login) {
            $allLogins->add($login);
          }
        }
      } catch (Exception $e) {
        // Skip invalid files
        continue;
      }
    }

    $this->setSysCheckModeAccordingToTT($allLogins);
  }

  public function fetchDependenciesForFile(string $name): ?array {
    return $this->_(
      "
        -- base case that starts the recursion
          WITH RECURSIVE dependencies AS (
            SELECT subject_name, object_name, relationship_type
            FROM file_relations
            WHERE subject_name = :name
              
            UNION ALL 
            
            -- recursive case
            SELECT fr.subject_name, fr.object_name, fr.relationship_type
            FROM file_relations fr
            INNER JOIN dependencies dep
              ON fr.subject_name = dep.object_name 
          )
          SELECT DISTINCT object_name, relationship_type
          FROM dependencies;",
      [
        ':name' => $name,
      ],
      true
    );
  }

  public function getDependentFilesByTypes(File $file, array $types = []): array {
    $sql = "SELECT
      files.name,
      files.type,
      files.id,
      files.label,
      files.description,
      files.is_valid,
      files.validation_report,
      files.size,
      files.modification_ts,
      files.version_mayor,
      files.version_minor,
      files.version_patch,
      files.version_label,
      files.verona_module_id,
      files.verona_module_type,
      files.verona_version,
      files.context_data
    FROM file_relations
      LEFT JOIN files
        ON file_relations.workspace_id = files.workspace_id
          AND file_relations.subject_name = files.name
          AND file_relations.subject_type = files.type
    WHERE
          files.workspace_id = :ws_id
          AND object_type = :file_type AND object_name= :file_name";

    $replacements = [
      ':ws_id' => $this->workspaceId,
      ':file_type' => $file->getType(),
      ':file_name' => $file->getName()
    ];

    // add more conditions
    if (!empty($types)) {
      $conditions = [];
      foreach ($types as $index => $type) {
        $conditions[] = "files.type = :type$index";
        $replacements[":type$index"] = $type;
      }
      $addCondition = ' AND (' . implode(' OR ', $conditions) . ')';
      $sql .= $addCondition;
    }

    return $this->fetchFiles($sql, $replacements);
  }

  private function updateValidUntilInPersonSession() {
    $this->_(
      "
      UPDATE person_sessions ps 
      JOIN login_sessions ls ON ps.login_sessions_id = ls.id
      JOIN logins l ON ls.name = l.name
      SET ps.valid_until = l.valid_to
      ",
      [],
      true
    );
  }
}
