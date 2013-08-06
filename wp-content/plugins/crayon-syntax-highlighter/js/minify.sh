#!/bin/bash
BASEDIR=$(dirname $0)
cd $BASEDIR

source ../util/minify.sh

common=$"$INPUT_PATH/util.js $INPUT_PATH/jquery.popup.js $INPUT_PATH/crayon.js $INPUT_PATH/cssjson.js"
minify $common $OUTPUT_PATH/crayon.min.js
minify $common $FANCY_PATH/jquery.fancybox.init.pack.js $TE_PATH/crayon_qt.js $TE_PATH/crayon_tag_editor.js $OUTPUT_PATH/crayon.te.min.js
