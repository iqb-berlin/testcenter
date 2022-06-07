<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

// TODO unit Test


class CSV {

    const allowedDelimiters = [',', ';', '|', '\t', '\s'];
    const allowedEnclosures = ['"', "'"];
    const allowedLineEndings = ["\r\n", "\r", "\n"]; // Win / Mac / Unix


    /**
     * builds string containing data CSV from a collections of heterogeneous arrays
     *
     * example:
     * $data = [
     *  [
     *      "color" => "green",
     *      "form" => "circle"
     *  ],
     *  [
     *      "color" => "blue",
     *      "pattern" => "dotted"
     *  ]
     * ]
     * echo CSV::build($data);
     * color,form,pattern
     * green,circle,
     * blue,,dotted
     *
     *
     * @param array $data - array of (assoc) arrays. keys are columns names, values are cell values
     * @param array $columnNames - names of columns to be written in csv. if empty, it will take all keys from the
     *      provided arrays as columns
     * @param string $delimiter - delimiter. falls back to default if not allowed
     * @param string $enclosure - enclosure. falls back to default if not allowed
     * @param string $lineDelimiter - line-delimiter. falls back to default if not allowed
     * @return string
     */
    static function build(array $data, array $columnNames = [],
                          string $delimiter = ',', string $enclosure = '"', string $lineDelimiter = '\n'): string {

        $columns = (is_array($columnNames) and count($columnNames))
            ? $columnNames
            : CSV::collectColumnNamesFromHeterogeneousObjects($data);
        $enclosure = in_array($enclosure, CSV::allowedEnclosures) ? $enclosure : '"';
        $delimiter = in_array($delimiter, CSV::allowedDelimiters) ? $delimiter : ',';
        $lineDelimiter = in_array($lineDelimiter, CSV::allowedLineEndings) ? $lineDelimiter : "\n";

        $csvRows = [];

        $csvRows[] = CSV::stringifyRow($columns, $delimiter, $enclosure);

        foreach ($data as $set) {

            $row = [];

            foreach ($columns as $column) {

                $row[] = $set[$column] ?? '';
            }

            $csvRows[] = CSV::stringifyRow($row, $delimiter, $enclosure);
        }

        return implode($lineDelimiter, $csvRows);
    }


    private static function stringifyRow($row, $delimiter, $enclosure): string {

        return implode(
            $delimiter,
            array_map(
                function($cell) use ($enclosure, $delimiter) {

                    return $enclosure . preg_replace('#(\\' . $enclosure . ')#', '`', (string) $cell) . $enclosure;
                },
                $row
            )
        );
    }


    /**
     * @param array $data - an array ofd assoc arrays
     * @return array - all used keys once
     */
    static function collectColumnNamesFromHeterogeneousObjects(array $data): array {

        return array_values(array_unique(array_reduce($data, function($agg, $array) {

            return array_merge($agg, array_keys($array));
        }, [])));
    }

}
