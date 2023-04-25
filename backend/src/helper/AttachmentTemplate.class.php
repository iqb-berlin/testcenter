<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit-test

class AttachmentTemplate {
  private const DEFAULT_LABEL_TEMPLATE = "%TESTTAKER% | %BOOKLET% | %UNIT% | %VAR%";

  public static function render(?string $labelTemplate, Attachment ...$attachments): string {
    $title = (count($attachments) > 1)
      ? implode(', ',
        array_unique(
          array_map(
            function(Attachment $attachment): string {
              return $attachment->_groupLabel;
            },
            $attachments
          )
        )
      )
      : self::applyTemplate($attachments[0], $labelTemplate);

    $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
    $pdf->SetCreator('IQB-Testcenter');
    $pdf->SetTitle($title);
    $pdf->setPrintHeader(false);
    $pdf->setPrintFooter(false);

    foreach ($attachments as $attachment) {
      $label = self::applyTemplate($attachment, $labelTemplate);

      $pdf->AddPage();
      $pdf->Bookmark($label, 0, 0, '', 'B', array(0, 64, 128));

      $pdf->MultiCell(0, 15, $label, 0, 'C');

      $style = array(
        'border' => 0,
        'vpadding' => 0,
        'hpadding' => 0,
        'fgcolor' => array(0, 0, 0),
        'bgcolor' => false, //array(255,255,255)
        'module_width' => 1, // width of a single module in points
        'module_height' => 1 // height of a single module in points
      );
      $pdf->write2DBarcode($attachment->attachmentId, 'QRCODE,L', 20, 20, 40, 40, $style, 'N');
    }

    return $pdf->Output('/* ignored */', 'S');
  }

  private static function applyTemplate(Attachment $attachment, ?string $labelTemplate = null): string {
    return str_replace(
      [
        '%GROUP%',
        '%TESTTAKER%',
        '%BOOKLET%',
        '%UNIT%',
        '%VAR%',
        '%LOGIN%',
        '%CODE%'
      ],
      [
        $attachment->_groupName,
        $attachment->personLabel,
        $attachment->_bookletName,
        $attachment->_unitName,
        $attachment->variableId,
        $attachment->_loginName,
        $attachment->_loginNameSuffix
      ],
      $labelTemplate ?? self::DEFAULT_LABEL_TEMPLATE
    );
  }
}