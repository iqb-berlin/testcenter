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


    public function storeFileMeta(int $workspaceId, File $file): void {

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
                    verona_module_id
                ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
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
                $file->getSpecialInfo()->playerId
            ]
        );
    }


    public function getFileNames(int $workspaceId): array {

        return $this->_('select type, name from files where workspace_id = ?', [$workspaceId], true);
    }


    /**
     * @codeCoverageIgnore
     */
    public function deleteFileMeta(int $workspaceId, string $name, string $type): void {

        $this->_("delete from files where workspace_id = ? and name = ? and type = ?", [$workspaceId, $name, $type]);
    }


    /**
     * @codeCoverageIgnore
     */
    public function getFile(int $workspaceId, string $fileId, string $type): ?array {

        return $this->_(
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
                    verona_module_id
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
    }


    // TODO use proper data-class
    public function getFileSimilarVersion(int $workspaceId, string $fileId, string $type): ?array {

        $version = Version::guessFromFileName($fileId);

        return $this->_(
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
    }
}
