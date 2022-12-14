<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class WorkspaceDAO extends DAO {

    public function getWorkspaceName($workspaceId): string {

        $workspace = $this->_(
            'SELECT workspaces.name 
            FROM workspaces
            WHERE workspaces.id=:workspace_id',
            [':workspace_id' => $workspaceId]
        );

        if ($workspace == null) {
            throw new HttpError("Workspace `$workspaceId` not found", 404); // @codeCoverageIgnore
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
    public function updateLoginSource(int $workspaceId, string $source, LoginArray $logins): array {

        $deleted = $this->deleteLoginSource($workspaceId, $source);
        $added = $this->addLoginSource($workspaceId, $source, $logins);
        return [$deleted, $added];
    }


    /**
     * @codeCoverageIgnore
     */
    public function addLoginSource(int $workspaceId, string $source, LoginArray $logins): int {

        foreach ($logins as $login) {

            $this->createLogin($login, $workspaceId, $source);
        }
        return count($logins->asArray());
    }


    /**
     * @codeCoverageIgnore
     */
    public function createLogin(Login $login, int $workspaceId, string $source): void {

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
                $workspaceId,
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
    public function deleteLoginSource(int $workspaceId, string $source): int {

        $this->_(
            'delete from logins where source = :source and workspace_id = :ws_id',
            [
                ':source' => $source,
                ':ws_id' => $workspaceId
            ]
        );
        return $this->lastAffectedRows;
    }


    public function storeFile(int $workspaceId, File $file): void {

        $version = Version::split($file->getSpecialInfo()->version);

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
                    modification_ts
                ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
            [
                $workspaceId,
                $file->getName(),
                $file->getId(),
                $version['major'],
                $version['minor'],
                $version['patch'],
                $version['label'],
                $file->getLabel(),
                $file->getDescription(),
                $file->getType(),
                (($file instanceof ResourceFile) and $file->isVeronaModule()) ? $file->getSpecialInfo()->veronaModuleType : '',
                $file->getSpecialInfo()->veronaVersion,
                $file->getSpecialInfo()->playerId,
                $file->isValid() ? 1 : 0,
                serialize($file->getValidationReport()),
                $file->getSize(),
                TimeStamp::toSQLFormat($file->getModificationTime())
            ]
        );

        foreach ($file->getRelations() as $relation) {

            /* @var $relation FileRelation */

            $this->_(
            "insert into file_relations (workspace_id, subject_name, subject_type, object_name, object_type, object_request)
                values (?, ?, ?, ?, ?, ?);",
                [
                    $workspaceId,
                    $file->getName(),
                    $file->getType(),
                    $relation->getTargetName(),
                    $relation->getTargetType(),
                    $relation->getTargetName() // TODO!
                ]
            );
        }
    }


    /**
     * @codeCoverageIgnore
     */
    public function deleteFile(int $workspaceId, File $file): void {

        $this->_("delete from files where workspace_id = ? and name = ? and type = ?", [$workspaceId, $file->getName(), $file->getType()]);
    }


    // TODO! duplicate id is now possible
    // TODO! workspacePath
    public function getFileById(int $workspaceId, string $workspacePath, string $fileId, string $type): ?File {

        $fileData =  $this->_(
            "select
                    name,
                    id,
                    version_mayor,
                    version_minor,
                    version_patch,
                    version_label,
                    label,
                    type,
                    description,
                    verona_module_type,
                    verona_module_id,
                    is_valid,
                    validation_report,
                    size,
                    modification_ts
                from
                    files
                where
                    workspace_id = ? and id = ? and type = ?",
            [
                $workspaceId,
                $fileId,
                $type
            ]
        );

        return $this->resultRow2File($workspacePath, $fileData, []);
    }


    // TODO! duplicate id is now possible
    // TODO! workspacePath
    public function getFileSimilarVersion(int $workspaceId, string $workspacePath, string $fileId, string $type): ?File {

        $version = Version::guessFromFileName($fileId);

        $fileData = $this->_(
            "select
                    name,
                    id,
                    version_mayor,
                    version_minor,
                    version_patch,
                    version_label,
                    label,
                    type,
                    verona_module_type,
                    verona_module_id,
                    is_valid,
                    validation_report,
                    size,
                    modification_ts,
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
                ':ws_id' => $workspaceId,
                ':file_id' => $fileId,
                ':type' => $type,
                ':version_mayor' => $version['major'],
                ':version_minor' => $version['minor'],
                ':version_patch' => $version['patch'],
                ':version_label' => $version['label'],
                ':module_id' => $version['module']
            ]
        );

        return $this->resultRow2File($workspacePath, $fileData, []);
    }


    public function updateUnitDefsAttachments(int $workspaceId, string $bookletName, array $attachments): void {

        $this->_(
            'delete from unit_defs_attachments where workspace_id = :workspace_id and booklet_name = :booklet_name;',
            [
                ':workspace_id' => $workspaceId,
                ':booklet_name' => $bookletName
            ]
        );

        foreach ($attachments as $requestedAttachment) {

            /* @var RequestedAttachment $requestedAttachment */

            $this->_(
                'replace into unit_defs_attachments(workspace_id, booklet_name, unit_name, variable_id, attachment_type)
                    values(:workspace_id, :booklet_name, :unit_name, :variable_id, :attachment_type)',
                [
                    ':workspace_id' => $workspaceId,
                    ':booklet_name' => $bookletName,
                    ':unit_name' => $requestedAttachment->unitName,
                    ':variable_id' => $requestedAttachment->variableId,
                    ':attachment_type' => $requestedAttachment->attachmentType
                ]);
        }
    }


    public function getAllFiles(int $workspaceId, string $workspacePath): array {

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
                modification_ts
            from files
                where workspace_id = ?";
        $replacements = [$workspaceId];

        return $this->fetchFiles($workspaceId, $workspacePath, $sql, $replacements);
    }


    private function getFileRelations(int $workspaceId, string $name, string $type): array {

        $relations = $this->_("
            select
                object_type,
                object_request
            from
                file_relations
            where
                workspace_id = ?
                and subject_name = ?
                and subject_type = ?",
            [$workspaceId, $name, $type],
            true
        );

        return array_map(
            function(array $r): FileRelation {
                return new FileRelation(
                    $r['object_type'],
                    $r['object_request'],
                    'TBA'
                );
            },
            $relations
        );
    }


    // TODO! dont' work with $localPaths!
    public function getFiles(int $workspaceId, string $workspacePath, array $localPaths): array {

        $placeholder = implode(' or ', array_fill(0, count($localPaths), '(type = ? and name = ?)'));

        $replacements = [$workspaceId];

        foreach ($localPaths as $fileLocalPath) {

            list($replacements[], $replacements[]) = explode('/', $fileLocalPath, 2);
        }

        $sql = "select distinct
                    name,
                    type,
                    id,
                    label,
                    description,
                    is_valid,
                    validation_report,
                    size,
                    modification_ts
                from files
                where
                    files.workspace_id = ?
                    and files.is_valid
                    and ($placeholder)";

        return $this->fetchFiles($workspaceId, $workspacePath, $sql, $replacements);
    }


    // TODO! get rid of int $workspaceId, string $workspacePath
    private function fetchFiles(int $workspaceId, string $workspacePath, $sql, $replacements): array {

        $files = [];
        foreach ($this->_($sql, $replacements, true) as $f) {
            // $relations = $this->getFileRelations($workspaceId, $f['name'], $f['type']);
            $files["{$f['type']}/{$f['name']}"] = $this->resultRow2File($workspacePath, $f, []);
        }
        return $files;
    }


    private function resultRow2File(string $workspacePath, array $row, array $relations): File {

        return File::get(
            new FileData(
                "$workspacePath/{$row['type']}/{$row['name']}",
                $row['type'],
                $row['id'],
                $row['label'],
                $row['description'],
                !!$row['is_valid'],
                unserialize($row['validation_report']),
                $relations,
                TimeStamp::fromSQLFormat($row['modification_ts']),
                $row['size']
            ),
            $row['type']
        );
    }


    public function getBlockedFiles(int $workspaceId, array $files): array {

        if (!count($files)) {
            return [];
        }

        $replacements = [
            ':ws_id' => $workspaceId
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
                        concat (object_type, '/', object_name) as ancestor
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
                    concat (object_type, '/', object_name) as blocked_by
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
}
