<?php


class ResourceFile {

    private $isXml = false;
    private $size = 0;
    private $filedate;

    public function __construct($filename, $unixtimestamp, $filesize) {
        $this->name = $filename;
        $this->filedate = date(DATE_ATOM, $unixtimestamp);
        $this->size = $filesize;
        $this->isXml = preg_match("/\.(XML|xml|Xml)$/", $filename) == true;
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
}
