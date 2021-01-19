<?php
declare(strict_types=1);


class ResourceFile extends File {

    const type = 'Resource';
    protected string $content = '';
    protected array $usedBy = [];
    protected array $meta = [];

    public function __construct(string $path, bool $validate = true) {

        parent::__construct($path);
        if ($this->isValid()) { // does it even exist?
            $this->content = file_get_contents($path);
        }
        if ($validate) {
            $this->validate();
        }
    }


    private function validate() {

        if ($this->isPlayer()) {
            $this->validatePlayer();
        }
    }


    private function isPlayer(): bool {

        $pathInfo = pathinfo($this->getPath());
        if (!isset($pathInfo['extension'])) {
            return false;
        }
        return in_array(strtoupper($pathInfo['extension']), ['HTML']);
    }


    // player is not it's own class, because player and other resources are stores in the same dir
    // TODO make player and resource two different types
    private function validatePlayer() {

        if (!$this->content) {
            return;
        }

        $document = new DOMDocument();
        $document->loadHTML($this->content, LIBXML_NOERROR);

        $this->readPlayerMetaData($document);
        $this->createLabelFromMeta();
        $this->analyzeMeta();
    }


    private function readPlayerMetaData(DOMDocument $document) {

        $this->meta['title'] = $this->getPlayerTitle($document);

        $meta = $this->getPlayerMetaElement($document);
        if (!$meta) {
            $this->report('warning', 'No meta-information for this player found.');
            return;
        }
        if (!$meta->getAttribute('content')) {
            $this->report('warning', 'Missing `content` attribute in meta-information!');
            return;
        }

        $this->meta['player-id'] = $meta->getAttribute('content');
        $this->meta['version'] = $meta->getAttribute('data-version');
        $this->meta['verona-version'] = $meta->getAttribute('data-api-version');

        foreach ($this->meta as $key => $value) {
            if (!$value) {
                unset($this->meta[$key]);
            }
        }
    }


    private function getPlayerMetaElement(DOMDocument $document): ?DOMElement {

        $metaElements = $document->getElementsByTagName('meta');
        foreach ($metaElements as $metaElement) { /* @var $metaElement DOMElement */
            if ($metaElement->getAttribute('name') == 'application-name') {
                return $metaElement;
            }
        }
        return null;
    }


    private function getPlayerTitle(DOMDocument $document): string {

        $titleElements = $document->getElementsByTagName('title');
        if (!count($titleElements)) {
            return '';
        }
        $titleElement = $titleElements[0]; /* @var $titleElement DOMElement */
        return $titleElement->textContent;
    }


    private function createLabelFromMeta(): void {

        if (isset($this->meta['title'])) {

            $this->label = $this->meta['title'];

        } else if (isset($this->meta['player-id'])) {

            $this->label = $this->meta['player-id'];
        }

        if (isset($this->meta['version'])) {

            if (strpos($this->label, $this->meta['version']) === false) {

                $this->label .= ' - ' . $this->meta['version'];
            }
        }
    }


    private function analyzeMeta(): void {

        if (isset($this->meta['verona-version'])) {
            $this->report('info', "Verona-Version supported: {$this->meta['verona-version']}");
        }
    }


//    private function createTypeFromMeta() {
//
//        if ($this->isPlayer()) {
//            $this->type = 'Player';
//        }
//    }


    public function getSpecialInfo(): array {

        $info = parent::getSpecialInfo();
        if (isset($this->meta['verona-version'])) {
            $info['verona-version'] = $this->meta['verona-version'];
        }
        if (isset($this->meta['version'])) {
            $info['version'] = $this->meta['version'];
        }
        return $info;
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
