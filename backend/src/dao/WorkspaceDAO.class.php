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

        $globalIds = $this->_(
            " select
                id,
                source,
                workspace_id,
                type
            from (
                     select name as id, source, workspace_id, 'login' as type from logins
                     union
                     select group_name as id, source, workspace_id, 'group' as type from logins group by group_name, source, workspace_id
            ) as globalIds",
            [],
            true
        );

        return array_reduce(
            $globalIds,
            function($agg, $globalId) {
                if (!isset($agg[$globalId['workspace_id']])) {
                    $agg[$globalId['workspace_id']] = [];
                }
                if (!isset($agg[$globalId['workspace_id']][$globalId['source']])) {
                    $agg[$globalId['workspace_id']][$globalId['source']] = [];
                }
                if (!isset($agg[$globalId['workspace_id']][$globalId['source']][$globalId['type']])) {
                    $agg[$globalId['workspace_id']][$globalId['source']][$globalId['type']] = [];
                }
                $agg[$globalId['workspace_id']][$globalId['source']][$globalId['type']][] = $globalId['id'];
                return $agg;
            },
            []
        );
    }


    /**
     * @codeCoverageIgnore
     */
    public function updateLoginSource(string $source, LoginArray $logins): array {

        $deleted = $this->deleteLoginSource($source);
        $added = $this->addLoginSource($source, $logins);
        return [$deleted, $added];
    }


    /**
     * @codeCoverageIgnore
     */
    public function addLoginSource(string $source, LoginArray $logins): int {

        foreach ($logins as $login) {

            $this->createLogin($login, $source);
        }
        return count($logins->asArray());
    }


    /**
     * @codeCoverageIgnore
     */
    public function createLogin(Login $login, string $source): void {

        $this->_('insert into logins 
                 (
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
                     valid_for
                 ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
                $login->getValidForMinutes()
            ]
        );
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


    // TODO! duplicate id is now possible
    public function getFileById(string $fileId, string $type): ?File {

        $fileData =  $this->_(
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


    // TODO! duplicate id is now possible
    public function getFileSimilarVersion(string $fileId, string $type): ?File {

        $version = Version::guessFromFileName($fileId);

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
                    context_data,
                    (case
                        when (verona_module_id = :module_id and version_mayor = :version_mayor and version_minor = :version_minor and version_patch = :version_patch and ifnull(version_label, '') = :version_label) then 1
                        when (workspace_id = :ws_id and type = :type and id = :file_id and verona_module_id != :module_id) then -1 
                        else 0
                    end) as match_type
                from
                    files
                where
                    (workspace_id = :ws_id and type = :type)
                    and
                    (
                        (
                            (verona_module_id = :module_id)
                            and
                            (version_mayor = :version_mayor)
                            and
                            (version_minor >= :version_minor)
                        )
                        or
                        (id = :file_id)
                    )
                order by match_type desc, version_minor desc, version_patch desc, version_label
                limit 1
            ",
            [
                ':ws_id' => $this->workspaceId,
                ':file_id' => $fileId,
                ':type' => $type,
                ':version_mayor' => $version['major'],
                ':version_minor' => $version['minor'],
                ':version_patch' => $version['patch'],
                ':version_label' => $version['label'],
                ':module_id' => $version['module']
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


    public function getFileRelations(string $name, string $type): array {

        $relations = $this->_("
            select
                object_type,
                object_id,
                relationship_type
            from
                file_relations
            where
                workspace_id = ?
                and subject_name = ?
                and subject_type = ?",
            [$this->workspaceId, $name, $type],
            true
        );

        return array_map(
            function(array $r): FileRelation {
                return new FileRelation(
                    $r['object_type'],
                    $r['object_id'],
                    constant("FileRelationshipType::{$r['relationship_type']}")
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

        $placeholder = implode(' or ', array_fill(0, $validFilePaths, '(type = ? and name = ?)'));
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
                    and ($placeholder)";

        return $this->fetchFiles($sql, $replacements);
    }


    private function fetchFiles($sql, $replacements): array {

        $files = [];
        foreach ($this->_($sql, $replacements, true) as $row) {

            $files[$row['type']] ??= [];
            // $relations = $this->getFileRelations($workspaceId, $row['name'], $row['type']);
            $files[$row['type']][$row['name']] = $this->resultRow2File($row, []);
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
                    select
                        subject_type as object_type,
                        subject_name as object_name,
                        object_type || '/' || object_name as ancestor
                    from file_relations
                    where
                        workspace_id = :ws_id and ($selectedFilesConditions)
                
                    union all
                
                    select
                        file_relations.subject_type as object_type,
                        file_relations.subject_name as object_name,
                        affected_files.ancestor
                    from affected_files
                        join file_relations
                            on affected_files.object_name = file_relations.object_name
                                and affected_files.object_type = file_relations.object_type
                                and file_relations.workspace_id = 6
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
}
