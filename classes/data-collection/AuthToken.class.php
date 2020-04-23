<?php


class AuthToken extends DataCollectionTypeSafe {

    protected $token;
    protected $id;
    protected $type;
    protected $workspaceId;
    protected $mode;

    public function __construct(
        string $token,
        int $id,
        string $type,
        int $workspaceId,
        string $mode
    ) {

        $this->token = $token;
        $this->id = $id;
        $this->type = $type;
        $this->workspaceId = $workspaceId;
        $this->mode = $mode;
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


}
