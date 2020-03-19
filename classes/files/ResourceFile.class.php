<?php
declare(strict_types=1);


class ResourceFile {

    private $isXml = false;
    private $size = 0;
    private $filedate;

    private $_content = '';


    public function __construct(string $fullFilePath, bool $infoOnly = false) {

        $this->name = basename($fullFilePath);
        $this->filedate = date(DATE_ATOM, filemtime($fullFilePath));
        $this->size = filesize($fullFilePath);
        $this->isXml = preg_match("/\.(XML|xml|Xml)$/", basename($fullFilePath)) == true;
        if (!$infoOnly) {
            $this->_content = file_get_contents($fullFilePath);
        }
    }


    public function getFileName() {

        return $this->name;
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


    public function getFileSize() {

        return $this->size;
    }


    public function getFileSizeString() {

        return FileSize::asString($this->size);
    }


    public function getIsXml() {

        return $this->isXml;
    }


    public function getContent() {

        return $this->_content;
    }
}
