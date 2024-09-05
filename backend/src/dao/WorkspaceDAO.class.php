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
      'select workspaces.name 
            from workspaces
            where workspaces.id=:workspace_id',
      [':workspace_id' => $this->workspaceId]
    );

    if ($workspace == null) {
      throw new HttpError("Workspace `$this->workspaceId` not found", 404); // @codeCoverageIgnore
    }

    return $workspace['name'];
  }

  public function getGlobalIds(): array {
    $globalIds = $this->_("
      select
        globalIds.id as id,
        source,
        workspace_id,
        workspaces.name as workspace_name,
        globalIds.type as type
      from (
        select name as id, source, workspace_id, 'login' as type from logins
        union
        select group_name as id, source, workspace_id, 'group' as type from logins group by group_name, source, workspace_id
      ) as globalIds
      left join workspaces on workspace_id
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

    $sql = 'insert into logins (
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
      monitors
    ) values';

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
          json_encode($login->getBooklets()),
          $login->getGroupName(),
          $login->getGroupLabel(),
          json_encode($login->getCustomTexts()),
          Password::encrypt($login->getPassword(), 't', true),
          $source,
          TimeStamp::toSQLFormat($login->getValidFrom()),
          TimeStamp::toSQLFormat($login->getValidTo()),
          $login->getValidForMinutes(),
          json_encode($login->getProfiles())
        ]
      );
      $sql .= '(' . implode(', ', $loginValues) . '),';
    }
    $sql = rtrim($sql, ",");

    $this->_($sql, [], true);

    $this->checkForSysCheckMode($logins);

    return count($logins->asArray());
  }

  /**
   * @codeCoverageIgnore
   */
  public function deleteLoginSource(string $source): int {
    $this->_(
      'delete from logins where source = :source and workspace_id = :ws_id',
      [
        ':source' => $source,
        ':ws_id' => $this->workspaceId
      ]
    );
    return $this->lastAffectedRows;
  }

  public function storeFile(File $file): void {
    $this->_("replace into files (
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
                ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
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
    $this->_("delete from files where workspace_id = ? and name = ? and type = ?", [$this->workspaceId, $file->getName(), $file->getType()]);
  }

  public function getFileById(string $fileId, string $type): ?File {
    $fileData = $this->_(
      "select
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
                from
                    files
                where
                    workspace_id = ? and id = ? and type = ?",
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
      'delete from unit_defs_attachments where workspace_id = :workspace_id and booklet_name = :booklet_name;',
      [
        ':workspace_id' => $this->workspaceId,
        ':booklet_name' => $bookletName
      ]
    );

    foreach ($attachments as $requestedAttachment) {
      /* @var RequestedAttachment $requestedAttachment */

      $this->_(
        'replace into unit_defs_attachments(workspace_id, booklet_name, unit_name, variable_id, attachment_type)
                    values(:workspace_id, :booklet_name, :unit_name, :variable_id, :attachment_type)',
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
            select
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
            from files
                where workspace_id = ?";
    $replacements = [$this->workspaceId];

    return $this->fetchFiles($sql, $replacements);
  }

  public function getFilesByNames(array $names): array {
    $sql = "
            select
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
            from files
                where workspace_id = ? and
                name in (" . implode(',', array_map(fn ($name) => '?', $names)) . ')';

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
            select
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
            from files
                where workspace_id = ?";
    $replacements = [$this->workspaceId];

    foreach ($conditions as $condition => $value) {
      $sql .= " and $condition = ?";
      $replacements[] = $value;
    }

    return $this->fetchFiles($sql, $replacements);
  }

  public function getFileRelations(string $name, string $type): array {
    $relations = $this->_("
            select
                object_type,
                object_name,
                relationship_type,
                id as object_id
            from
                file_relations
                left join files
                    on file_relations.workspace_id = files.workspace_id
                       and file_relations.object_name = files.name
                       and file_relations.object_type = files.type
            where
                files.workspace_id = ?
                    and subject_name = ?
                    and subject_type = ?",
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

    $filePathCondition = implode(' or ', array_fill(0, $validFilePaths, '(type = ? and name = ?)'));
    $filePathCondition = $filePathCondition ? "and ($filePathCondition)" : '';

    $andIsValid = $includeInvalid ? '' : ' and files.is_valid';

    $sql = "select distinct
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
                from files
                where
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
      $conditions[] = "(object_type = :type_$i and object_name = :name_$i)";
    }

    $selectedFilesConditions = implode(' or ', $conditions);

    $sql = "with recursive affected_files as (
                    -- base/first case that initializes the recursion
                    select
                        subject_type as object_type,
                        subject_name as object_name,
                        object_type || '/' || object_name as ancestor
                    from file_relations
                    where
                        workspace_id = :ws_id and ($selectedFilesConditions)
                
                    union all
                
                    -- recursive case
                    select
                        file_relations.subject_type as object_type,
                        file_relations.subject_name as object_name,
                        affected_files.ancestor
                    from affected_files
                        join file_relations
                            on affected_files.object_name = file_relations.object_name
                                and affected_files.object_type = file_relations.object_type
                                and file_relations.workspace_id = :ws_id
                )
                select distinct
                    affected_files.ancestor as file_local_path,
                    object_type || '/' || object_name as blocked_by
                from affected_files
                where
                    not ($selectedFilesConditions)";

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
        "replace into file_relations (workspace_id, subject_name, subject_type, relationship_type, object_type, object_name)
                values (?, ?, ?, ?, ?, ?);",
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
          "select distinct
            unitFiles.id,
            resourceFiles.type,
            resourceFiles.name,
            unitNeedsResource.relationship_type
          from file_relations as bookletContainsUnit
            left join file_relations as unitNeedsResource
              on bookletContainsUnit.workspace_id = unitNeedsResource.workspace_id
                and bookletContainsUnit.object_name = unitNeedsResource.subject_name
                and bookletContainsUnit.object_type = unitNeedsResource.subject_type
--                and unitNeedsResource.relationship_type in('isDefinedBy', 'usesPlayer')
                and unitNeedsResource.object_type = 'Resource'
                and bookletContainsUnit.relationship_type = 'containsUnit'
            left join files as resourceFiles
              on resourceFiles.type = unitNeedsResource.object_type
                and resourceFiles.name = unitNeedsResource.object_name
                and resourceFiles.workspace_id = unitNeedsResource.workspace_id
            left join files as unitFiles
              on unitFiles.type = unitNeedsResource.subject_type
                and unitFiles.name = unitNeedsResource.subject_name
                and unitFiles.workspace_id = unitNeedsResource.workspace_id
            where
              bookletContainsUnit.subject_name = :booklet_file_name
              and resourceFiles.workspace_id = :ws_id
              and resourceFiles.is_valid = 1",
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
      "select workspace_hash from workspaces where id = :ws_id",
      [':ws_id' => $this->workspaceId]
    )['workspace_hash'];
  }

  public function setWorkspaceHash(string $hash): void
  {
    $this->_(
      "update workspaces set workspace_hash = :hash where id = :ws_id",
      [':hash' => $hash, ':ws_id' => $this->workspaceId]
    );
  }

  private function checkForSysCheckMode(LoginArray $logins) {
    /** @var Login $login */
    foreach ($logins as $login) {
      if ($login->getMode() == 'sys-check-login') {
        $this->_(
          "update workspaces set content_type = 'sysCheck' where id = :ws_id",
          [':ws_id' => $this->workspaceId],
          true
        );
      }
    }
  }

  public function fetchDependenciesForFile(string $name): ?array {
    return $this->_(
      "
        -- base case that starts the recursion
          with recursive dependencies as (
            select subject_name, object_name, relationship_type
            from file_relations
            where subject_name = :name
              
            union all 
            
            -- recursive case
            select fr.subject_name, fr.object_name, fr.relationship_type
            from file_relations fr
            inner join dependencies dep
              on fr.subject_name = dep.object_name 
          )
          select distinct object_name, relationship_type
          from dependencies;",
      [
        ':name' => $name,
      ],
      true
    );
  }

  public function getDependentFilesByTypes(File $file, array $types = []): array {
    $sql = "select
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
    from file_relations
      left join files
        on file_relations.workspace_id = files.workspace_id
          and file_relations.subject_name = files.name
          and file_relations.subject_type = files.type
    where
          files.workspace_id = :ws_id
          and object_type = :file_type and object_name= :file_name";

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
      $addCondition = ' and (' . implode(' or ', $conditions) . ')';
      $sql .= $addCondition;
    }

    return $this->fetchFiles($sql, $replacements);
  }
}
