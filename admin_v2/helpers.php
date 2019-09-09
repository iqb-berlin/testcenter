<?php

/**
 * a set of recurrent helper functions
 */


function jsonencode($obj) {
    return json_encode($obj, JSON_UNESCAPED_UNICODE);
}
