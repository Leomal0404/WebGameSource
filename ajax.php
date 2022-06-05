<?php
    header('Content-type: application/json; charset=utf-8'); // ヘッダ（データ形式、文字コードなど指定）

    //暗号化パラメータ
    define('PASSWORD','idsidsiwsiws');
    define('IV','1234567890123456');

    $data = "";

    if($_POST['mode'] == "loadJSON"){
        $file_json = file_get_contents('./data/'.$_POST['src'].'.json');
        $file_json_Decode = json_decode($file_json, true);
        $data = json_encode($file_json_Decode,JSON_UNESCAPED_UNICODE);
    }
    else if($_POST['mode'] == "loadAccount"){
        $file_json = file_get_contents('./user/'.$_POST['src'].'.json');
        $file_json_Decode = json_decode($file_json, true);
        $data = json_encode($file_json_Decode,JSON_UNESCAPED_UNICODE);
    }
    else if($_POST['mode'] == "saveAccount"){
        if(file_put_contents('./user/'.$_POST['src'].'.json', $_POST['data'])) $data = "UPDATE_COMPLETE";
        else $data = "UPDATE_FAILURE";
    }
    else if($_POST['mode'] == "login"){
        // $password = PASSWORD;
        // $method = 'aes-256-cbc';
        // $options = OPENSSL_RAW_DATA;
        // // 16桁
        // $iv = IV;

        //受信データを取得
        $loginInfo = json_decode($_POST['data'], true);
        $mail = $loginInfo['mail'];
        $pass = $loginInfo['pass'];

        // ユーザーデータを取得
        $file_json = file_get_contents('./user/userList.json');
        $userData = json_decode($file_json, true);

        // ログイン情報比較
        $userPass = $userData[$mail][0];
        $userID = $userData[$mail][1];

        if($userPass == $pass) $data = '{"state":"success", "user":"'. $userID .'"}';
        else $data = '{"state":"failure"}';

        // //暗号化
        // $enc_mail = openssl_encrypt(
        //     $mail,
        //     $method,
        //     $password,
        //     $options,
        //     $iv
        // );
        // $enc_pass = openssl_encrypt(
        //     $pass,
        //     $method,
        //     $password,
        //     $options,
        //     $iv
        // );        
    }

    $param = array("data"=>$data, "name"=>$_POST['name']);
    echo json_encode($param);
?>