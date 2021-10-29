<?php

declare(strict_types=1);


final class ReportFormat {

    const CSV = 'csv';
    const JSON = 'json';

    private string $value;


    /**
     * @throws InvalidArgumentException
     */
    public function __construct(string $value) {

        if (self::isValid($value)) {
            $this->value = $value;

        } else {
            throw new InvalidArgumentException("Report format value is invalid!");
        }
    }


    final public static function isValid($value): bool {

        return in_array($value, self::toArray());
    }


    final public static function toArray(): array {

        return (new ReflectionClass(ReportFormat::class))->getConstants();
    }


    /**
     * @return string
     */
    public function getValue(): string {

        return $this->value;
    }

}
