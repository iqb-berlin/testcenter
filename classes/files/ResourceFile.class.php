<?php
declare(strict_types=1);


class ResourceFile extends File {

    const type = 'Resource';

    protected $_content = '';
    protected array $usedBy = [];


    public function __construct(string $path, bool $infoOnly = false) {

        parent::__construct($path);

        if (!$infoOnly) {
            $this->_content = file_get_contents($path);
        }
    }


    public function crossValidate(WorkspaceValidator $validator): void {

    }


    public function addUsedBy(File $file): void {

        $this->usedBy[] = $file;
    }


    public function isUsed(): bool {

        return count($this->usedBy) > 0;
    }


    public function getFileDateTime() {

        if (isset($this->filedate) && (strlen($this->filedate) > 0)) {
            return strtotime ( $this->filedate );
        } else {
            return 0;
        }
    }


    public function getFileDateTimeString() {

        $filedatevalue = $this->getFileDateTime();
        if ($filedatevalue == 0) {
            return 'n/a';
        } else {
            return strftime('%d.%m.%Y', $filedatevalue);
        }
    }


    public function getContent() {

        return $this->_content;
    }
}
