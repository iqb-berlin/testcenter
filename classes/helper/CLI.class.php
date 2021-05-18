<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

class CLI {


    private const foreground = [
        "Black" => "30",
        "Red" => "31",
        "Green" => "32",
        "Brown" => "33",
        "Blue" => "34",
        "Magenta" => "35",
        "Cyan" => "36",
        "Grey" => "37",
    ];

    private const background = [
        "Black" => "40",
        "Red" => "41",
        "Green" => "42",
        "Yellow" => "43",
        "Blue" => "44",
        "Magenta" => "45",
        "Cyan" => "46",
        "Grey" => "47",
    ];

    static function connectDBWithRetries(?DBConfig $config = null, int $retries = 5): void {

        while ($retries--) {

            try {

                CLI::p("Database Connection attempt.");
                DB::connect($config);
                CLI::success("Database Connection successful!");
                return;

            } catch (Throwable $t) {

                CLI::warning("Database Connection failed! Retry: $retries attempts left.");
                usleep(20 * 1000000); // give database container time to come up
            }
        }

        CLI::printData(DB::getConfig());
        throw new Exception("Database connection failed.");
    }


    static function printData(DataCollection $dataCollection): void {

        echo "\n " . get_class($dataCollection);
        foreach ($dataCollection->jsonSerialize() as $key => $value) {

            echo "\n - $key: " . (strstr('password', $key) ? Password::shorten($value) : $value);
        }
    }


    static function p(string $text): void {

        echo "\n$text";
    }


    static function h1(string $text): void {


        CLI::printColored($text, "Blue", "Grey", true);
    }


    static function h2(string $text): void {


        CLI::printColored($text, "Black", "Grey", true);
    }


    static function h3(string $text): void {


        CLI::printColored($text, "Green", "Grey", true);
    }


    static function h(string $text): void {


        CLI::printColored($text, "Grey", "Black", true);
    }


    static function warning(string $text): void {


        CLI::printColored($text, "Red");
    }


    static function error(string $text): void {


        CLI::printColored($text, "Red", null, true);
    }


    static function success(string $text): void {


        CLI::printColored($text, "Green");
    }


    static private function printColored(string $text, string $fg, string $bg = null, bool $bold = false): void {

        $colorString = ($bold ? '1' : '0') . ';' . CLI::foreground[$fg] . ($bg ? ';' . CLI::background[$bg] : '');
        echo "\n\e[{$colorString}m{$text}\e[0m";
    }
}
