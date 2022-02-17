<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;


final class ReportFormatTest extends TestCase {

    static function setUpBeforeClass(): void {

        require_once "classes/data-collection/ReportFormat.php";
    }

    /**
     * @throws Exception
     */
    function test__construct(): void {

        // Arrange
        $validReportFormatValue = ReportFormat::JSON;

        // Act
        $reportFormat = new ReportFormat($validReportFormatValue);
        $actualReportFormatValue = $reportFormat->getValue();

        // Assert
        parent::assertTrue(ReportFormat::isValid($validReportFormatValue));
        parent::assertSame($validReportFormatValue, $actualReportFormatValue);
    }

    /**
     * @throws Exception
     */
    function test__constructThrowsInvalidArgumentException(): void {

        // Arrange
        $invalidReportFormatValue = "unknown report format";
        $expectedMessage = "/^Report format value is invalid!/i";

        // Assert
        parent::assertFalse(ReportFormat::isValid($invalidReportFormatValue));
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessageMatches($expectedMessage);

        // Act
        new ReportFormat($invalidReportFormatValue);
    }

    /**
     * @throws Exception
     */
    function testGetValue(): void {

        // Arrange
        $validReportFormatValue = ReportFormat::CSV;

        // Act
        $reportFormat = new ReportFormat($validReportFormatValue);
        $actualReportFormatValue = $reportFormat->getValue();

        // Assert
        parent::assertSame($validReportFormatValue, $actualReportFormatValue);
    }

    function testToArray(): void {

        // Arrange
        $expectedReportFormats = [
            'CSV' => 'csv',
            'JSON' => 'json'
        ];

        // Act
        $actualReportFormats = ReportFormat::toArray();

        // Assert
        parent::assertEquals($expectedReportFormats, $actualReportFormats);
    }

    function testIsValidReturnsTrue(): void {

        // Arrange
        $validReportFormatValue = ReportFormat::JSON;

        // Act
        $actualReportFormatIsValid = ReportFormat::isValid($validReportFormatValue);

        // Assert
        parent::assertTrue($actualReportFormatIsValid);
    }

    function testIsValidReturnsFalse(): void {

        // Arrange
        $invalidReportFormatValue = "unknown report format";

        // Act
        $actualReportFormatIsValid = ReportFormat::isValid($invalidReportFormatValue);

        // Assert
        parent::assertFalse($actualReportFormatIsValid);
    }

}
