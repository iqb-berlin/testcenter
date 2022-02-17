<?php


class AuthToken extends DataCollectionTypeSafe {

    protected $token;
    protected $id;
    protected $type;
    protected $workspaceId;
    protected $mode;
    protected $group;

    public function __construct(
        string $token,
        int $id,
        string $type,
        int $workspaceId,
        string $mode,
        string $group
    ) {

        $this->token = $token;
        $this->id = $id;
        $this->type = $type;
        $this->workspaceId = $workspaceId;
        $this->mode = $mode;
        $this->group = $group;
    }


    public function getToken(): string {

        return $this->token;
    }


    public function getId(): int {

        return $this->id;
    }


    public function getType(): string {

        return $this->type;
    }


    public function getWorkspaceId(): int {

        return $this->workspaceId;
    }


    public function getMode(): string {

        return $this->mode;
    }


    public function getGroup(): string {

        return $this->group;
    }
}
