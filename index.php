<?php
$result = '';

$languages = explode(',', $_SERVER['HTTP_ACCEPT_LANGUAGE']);
$languages = array_reverse($languages);
 
foreach ($languages as $language) {
    if (preg_match('/^ja/i', $language)) {
        $result = 'jp';
    }
    else if (preg_match('/^en/i', $language)) {
        $result = 'en';
    }
    else {
        $result = 'en';
    }
}
?>
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>AnimWarriors</title>
<meta name="viewport" content="width=device-width,initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<link rel="stylesheet" href="./css/style.css?<?php echo time(); ?>">
<script src="./js/lib/jquery-3.6.0.min.js"></script>
<script src="./js/lib/pixi.min.js"></script>
<script src="./js/lib/pixi-spine.js"></script>
<script src="./js/lib/pixi-filters/dist/pixi-filters.js"></script>
<script src="./js/lib/cryptico.js"></script>
</head>
<body onload="onload();">
    <script type="text/javascript">
        let BrowserLanguage = '<?php echo $result ?>';
        function closeModal(){
            document.getElementById('modalWindow').style.pointerEvents = 'none';
            document.getElementById('modalWindow').style.backgroundColor = 'rgba(0,0,0,0)';
            document.getElementById('modal_content').style.display = 'none';
        }
    </script>
    <div id="modalWindow" class="modalWindow">
        <div id="modal_content">
            <div id="generalArea">
                <div id="generalInfo">
                </div>
                <div id="generalCloseBtn"><img onclick="closeModal();" src="./img/006_system/closebutton.png" width="36" height="36"></div>
            </div>            
        </div>
    </div>
    <div id="container">
        <div id="canvasParent">
            
        </div>
        <script id="netWork" type="text/javascript" src="./js/network.js?<?php echo time(); ?>"></script>
        <script id="global" type="text/javascript" src="./js/globalHandler.js?<?php echo time(); ?>"></script>
        <script id="mainStream" type="text/javascript" src="./js/main.js?<?php echo time(); ?>"></script>
        <script id="title" type="text/javascript" src="./js/title.js?<?php echo time(); ?>"></script>
        
    </div>
    
</body>
</html>