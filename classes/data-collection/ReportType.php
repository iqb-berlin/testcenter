<?php

declare(strict_types=1);


final class ReportType {

    const SYSTEM_CHECK = 'sys-check';
    const RESPONSE = 'response';
    const LOG = 'log';
    const REVIEW = 'review';

    private string $value;


    /**
     * ReportType constructor.
     * @throws InvalidArgumentException
     */
    public function __construct(string $value) {

        if (self::isValid($value)) {
            $this->value = $value;

        } else {
            throw new InvalidArgumentException("Report type value is invalid!");
        }
    }


    final public static function isValid($value): bool {

        return in_array($value, self::toArray());
    }


    final public static function toArray(): array {

        return (new ReflectionClass(ReportType::class))->getConstants();
    }


    /**
     * @return string The report type value
     */
    public function getValue(): string {

        return $this->value;
    }

}
