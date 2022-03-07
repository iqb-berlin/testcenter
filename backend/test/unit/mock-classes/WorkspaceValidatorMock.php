<?php

class WorkspaceValidatorMock extends WorkspaceValidator {
    /** @noinspection PhpMissingParentConstructorInspection */
    public function __construct(array $mockResources) {
        $this->allFiles['Resource'] = [];
        foreach ($mockResources as $mockResource) {
            $this->allFiles['Resource'][$mockResource] = new ResourceFileMock($mockResource);
        }
        $this->createVersionMap();
    }
}