<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit-test

class AttachmentTemplate {

    public static function render(string $title, Attachment ...$attachments): string {

        $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
        $pdf->SetCreator('IQB-Testcenter');
        $pdf->SetTitle($title);
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);

        foreach ($attachments as $attachment) {

            $pdf->AddPage();
            $pdf->Bookmark($attachment->_label, 0, 0, '', 'B', array(0,64,128));

            $style = array(
                'border' => 0,
                'vpadding' => 0,
                'hpadding' => 0,
                'fgcolor' => array(0,0,0),
                'bgcolor' => false, //array(255,255,255)
                'module_width' => 1, // width of a single module in points
                'module_height' => 1 // height of a single module in points
            );

            $pdf->write2DBarcode($attachment->attachmentId, 'QRCODE,L', 20, 20, 40, 40, $style, 'N');
        }

        return $pdf->Output('/* ignored */', 'S');
    }
}