<?php
/**
 * Class TypedArray
 *
 * implement typed functions:
 *
 *
class Dummies extends TypedArray {
public function __construct(Dummy ...$dummies) {
parent::__construct($dummies);
}
public function add(Dummy $dummy): void {
parent::append($dummy);
}
public function set(int $key, Dummy $dummy) {
parent::offsetSet($key, $dummy);
}
public function current(): Dummy {
return parent::current();
}
}
 *
 *
 *
 */


abstract class TypedArray extends IteratorIterator implements JsonSerializable {

    public function __construct($array) {

        parent::__construct(new ArrayIterator($array));
    }

    public function __debugInfo() {

        return iterator_to_array($this->getInnerIterator());
    }

    public function count(): int {

        return $this->getInnerIterator()->count();
    }

    public function get(int $id) {

        return iterator_to_array($this->getInnerIterator())[$id];
    }

    public function toArray(): array {

        return iterator_to_array($this->getInnerIterator());
    }

    protected function append($item) {

        $this->getInnerIterator()->append($item);
    }

    protected function offsetSet(int $key, $item) {

        $this->getInnerIterator()->offsetSet($key, $item);
    }

    public function jsonSerialize() {

        return iterator_to_array($this->getInnerIterator());
    }

}
