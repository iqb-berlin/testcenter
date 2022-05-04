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
                $login->getPassword(),
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
                (($file instanceof ResourceFile) and $file->isPlayer()) ? 'player' : '',
                $file->getSpecialInfo()->veronaVersion,
                $file->getSpecialInfo()->playerId
            ]
        );
    }


    /**
     * @codeCoverageIgnore
     */
    public function deleteFileMeta(int $workspaceId, $name): void {

        $this->_("delete from files where workspace_id = ? and name = ?", [$workspaceId, $name]);
    }


    public function storePackageFile(int $workspaceId, ResourceFile $file, string $fileName, $fileStream) {

        $increaseMaxima = $this->pdoDBhandle->prepare('SET global max_allowed_packet := 1000000000;');
        $increaseMaxima->execute();
        $increaseMaxima->fetchAll();

        print_r($fileStream);
        $packageName = $file->getPackageName();
        $sqlStatement = $this->pdoDBhandle->prepare(
            "replace into files (workspace_id, name, package, content) values (?, ?, ?, ?);
            SHOW VARIABLES LIKE 'max_allowed_packet';"
        );
//        $sqlStatement->execute([$workspaceId, $fileName, $packageName, $fileContent]);
        $sqlStatement->bindParam(1, $workspaceId);
        $sqlStatement->bindParam(2, $fileName);
        $sqlStatement->bindParam(3, $packageName);
        $sqlStatement->bindParam(4, $fileStream,PDO::PARAM_LOB);


        $sqlStatement->execute();
        $f = $sqlStatement->fetchAll();
        var_dump($f);
    }


    public function getPackageFileSize(int $workspaceId, string $package, string $fileName): int {

        return (int) $this->_(
            "select octet_length(content) as l from files where workspace_id= ? and package= ? and name = ?",
            [$workspaceId, $package, $fileName]
        )['l'];

    }


    public function getPackageFile(int $workspaceId, string $package, string $fileName): string {

        $sqlStatement = $this->pdoDBhandle->prepare("select content from files where workspace_id= ? and package= ? and name = ?");
        $sqlStatement->execute([$workspaceId, $package, $fileName]);
        $sqlStatement->bindColumn(1, $lob, PDO::PARAM_LOB);
        $sqlStatement->fetch(PDO::FETCH_BOUND);

        // unfortunately MySQl does not support streams, so we retrieve the file as string
        // TODO make this more efficient and use less memory
        return $lob;
    }
}
