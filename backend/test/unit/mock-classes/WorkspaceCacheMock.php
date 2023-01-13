<?php

class WorkspaceCacheMock extends WorkspaceCache {
    /** @noinspection PhpMissingParentConstructorInspection */
    public function __construct(array $mockResources) {
        $this->cachedFiles['Resource'] = [];
        foreach ($mockResources as $mockResource) {
            $this->cachedFiles['Resource'][$mockResource] = new ResourceFileMock($mockResource);
        }
        $this->createVersionMap();
    }
}