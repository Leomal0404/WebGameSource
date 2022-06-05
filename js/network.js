//JSON読み込み
function loadJSON(name, src){
    return $.ajax({
        type: "POST",
        data: {'mode':'loadJSON', 'name': name, 'src': src},
        scriptCharset: 'utf-8',
        url: "ajax.php",
        dataType : "json"
    });
}

//アカウントデータ読み込み
function loadAccountJSON(name, src){
    return $.ajax({
        type: "POST",
        data: {'mode':'loadAccount', 'name': name, 'src': 'user_'+ src},
        scriptCharset: 'utf-8',
        url: "ajax.php",
        dataType : "json"
    });
}

//アカウントデータ更新
function saveAcountJSON(){
    $.ajax({
        type: "POST",       
        data: {'mode':'saveAccount', 'data': JSON.stringify(jsonContainer["userData"]), 'src': 'user_'+ USER, 'name': "userData"},        
        scriptCharset: 'utf-8',
        url: "ajax.php",
        dataType : "json"
    })
    .then(
        function(param){
            //console.log(param.data);
        },
        function(XMLHttpRequest, textStatus, errorThrown){
            console.log(XMLHttpRequest);
    });
}

// 汎用Ajax通信
function AjaxSend(mode, data){
    $.ajax({
        type: "POST",       
        data: {'mode':mode, 'data':JSON.stringify(data), 'src':'user_'+ USER},        
        scriptCharset: 'utf-8',
        url: "ajax.php",
        dataType : "json"
    })
    .then(
        function(param){
            console.log(param.data);
        },
        function(XMLHttpRequest, textStatus, errorThrown){
            console.log(XMLHttpRequest);
    });
}

//画像読み込み
function loadImage(name, src){
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = './img/'+ src;
    });
}

//PIXI画像読み込み→スプライト化格納
// function loadImagePIXI(src, name){

// }