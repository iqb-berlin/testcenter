<?php
declare(strict_types=1);


class ResourceFile extends File {

    const type = 'Resource';

    protected $content = '';
    protected array $usedBy = [];


    public function __construct(string $path) {

        parent::__construct($path);
        if ($this->isValid()) {
            $this->content = file_get_contents($path);
        }
    }

    public function addUsedBy(File $file): void {

        $this->usedBy[] = $file;
    }


    public function isUsed(): bool {

        return count($this->usedBy) > 0;
    }


    public function getContent(): string {

        return $this->content;
    }
}
