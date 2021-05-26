<?php


class BroadcastService {

    public static $log = [];

    static function sessionChange(SessionChangeMessage $sessionChange): ?string {

        self::$log[] = (string) $sessionChange;
        return (string) $sessionChange;
    }
}


class MockObject {

    function __toString() {

        $sumury = [];

        foreach ((array) $this as $prop => $val) {

            $sumury[] = is_array($val) ? "$prop (" . count($val) . ")" : "$prop: $val";
        }

        return '[' . get_called_class() . "]: " . implode(', ', $sumury);
    }
}


class Person extends MockObject {

    public $name = "";

    function __construct(string $name = 'someone') {
        $this->name = $name;
    }

    function getId() {

        return 123;
    }
}


class Login extends MockObject {

    public $name = "";
    public $mode = "";

    function __construct(string $name = 'someone', string $mode = 'somemode') {
        $this->name = $name;
        $this->mode = $mode;
    }

    function getMode() {
        return $this->mode;
    }

    function getName() {
        return $this->name;
    }

    function getWorkspaceId() {
        return 1;
    }


}




class PotentialLogin extends Login {

     function getBooklets(): array {

        return [
            'code1' => ['a booklet'],
            'code2' => ['a booklet', 'another booklet']
        ];
    }
}



class SessionChangeMessage {

    public $constructorFunction = "";
    public $constructorArguments = [];

    public function __construct(string $function, array $arguments) {

        $this->constructorFunction = $function;
        $this->constructorArguments = $arguments;
    }

    public static function __callStatic($name, $arguments) {

        return new SessionChangeMessage($name, $arguments);
    }

    public function setTestState(array $testState, string $bookletName = null): void {

        $this->constructorArguments[] = "test: $bookletName";
    }

    function __toString() {

        return "{$this->constructorFunction}: " . implode(', ', $this->constructorArguments);
    }
}

class SessionDAO {

    public function getOrCreateLogin(PotentialLogin $loginData): Login {

        return new Login($loginData->name, $loginData->mode);
    }

    public function getOrCreatePerson(Login $loginSession, string $code): Person {

        return new Person("{$loginSession->name}/$code");
    }
}


class TestDAO {

    static $counter;

    public function getOrCreateTest(int $personId, string $bookletName, string $bookletLabel): array {

        self::$counter++;

        return [
            'id' => self::$counter,
            'label' => $bookletLabel,
            'name' => $bookletName,
            'person_id' => $personId,
        ];
    }
}

class TesttakersFolder {

    function getPersonsInSameGroup(string $name): array {

        return [
            new PotentialLogin("{$name}_1", "hot"),
            new PotentialLogin("{$name}_2", "hot")
        ];
    }
}

class BookletsFolder {

    function getBookletLabel(string $bookletName): string {

        return "label of $bookletName";
    }

}
