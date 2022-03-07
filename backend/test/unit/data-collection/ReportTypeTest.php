<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;


final class ReportTypeTest extends TestCase {

    static function setUpBeforeClass(): void {

        require_once "src/data-collection/ReportType.php";
    }

    /**
     * @throws Exception
     */
    function test__construct(): void {

        // Arrange
        $validReportTypeValue = ReportType::SYSTEM_CHECK;

        // Act
        $reportType = new ReportType($validReportTypeValue);
        $actualReportTypeValue = $reportType->getValue();

        // Assert
        parent::assertTrue(ReportType::isValid($validReportTypeValue));
        parent::assertSame($validReportTypeValue, $actualReportTypeValue);
    }

    /**
     * @throws Exception
     */
    function test__constructThrowsInvalidArgumentException(): void {

        // Arrange
        $invalidReportTypeValue = "unknown report type";
        $expectedMessage = "/^Report type value is invalid!/i";

        // Assert
        parent::assertFalse(ReportType::isValid($invalidReportTypeValue));
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessageMatches($expectedMessage);

        // Act
        new ReportType($invalidReportTypeValue);
    }

    function testIsValidReturnsTrue(): void {

        // Arrange
        $validReportTypeValue = ReportType::REVIEW;

        // Act
        $actualReportTypeIsValid = ReportType::isValid($validReportTypeValue);

        // Assert
        parent::assertTrue($actualReportTypeIsValid);
    }

    function testIsValidReturnsFalse(): void {

        // Arrange
        $invalidReportTypeValue = "unknown report type";

        // Act
        $actualReportTypeIsValid = ReportType::isValid($invalidReportTypeValue);

        // Assert
        parent::assertFalse($actualReportTypeIsValid);
    }

    function testToArray(): void {

        // Arrange
        $expectedReportTypes = [
            'LOG' => 'log',
            'RESPONSE' => 'response',
            'REVIEW' => 'review',
            'SYSTEM_CHECK' => 'sys-check'
        ];

        // Act
        $actualReportTypes = ReportType::toArray();

        // Assert
        parent::assertEquals($expectedReportTypes, $actualReportTypes);
    }

    /**
     * @throws Exception
     */
    function testGetValue(): void {

        // Arrange
        $validReportTypeValue = ReportType::RESPONSE;

        // Act
        $reportType = new ReportType($validReportTypeValue);
        $actualReportTypeValue = $reportType->getValue();

        // Assert
        parent::assertSame($validReportTypeValue, $actualReportTypeValue);
    }

}
