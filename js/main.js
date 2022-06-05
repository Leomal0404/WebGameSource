const FRAMERATE = 60;
const fullWidth = 2500;
const fullHeight = 1080;
const GamePhrase = "AnimWarriorsIDS";
let canvasParent = document.getElementById("canvasParent");

let cookieData = {};

let app;
const width = 2500;
const height = 1080;
const widRatio = 0.9;
const heiRatio = 0.95;
let resizeRatio = 1;

let lang;
let USER;

let mouseX = 0;
let mouseY = 0;

let xOffset = 0;
let sizeRate = 1;

let configJSON;

let frame = 0;
let totalFrame = 0;
let startTime, endTime;
let fps = 0;

let titleContent;
let homeContent;
let battleContent;
let heroListContent;
let heroCustomContent;
let itemListContent;
let jungleContent;

let updateTarget = [];
let renderTarget = [];

let tween = new Tween();

let textureContainer = {};
let spriteContainer = {};
let spineContainer = {};
let spineRawData = {};
let jsonContainer = {};
let ownHeroSpineContainer = {};
let enemyHeroSpineContainer = {};

let functionObject = {};

let loadProgress = 0;

let text_style = new PIXI.TextStyle({
    fontSize:48,
    fill:'#ffffff',
    stroke:'#000000',
    strokeThickness:5,
    wordWrap: true,
    wordWrapWidth: 1500
});
let fpsText = new PIXI.Text('', text_style);

//起動時処理
let onload = () => {
    format();
};

//初期化
function format(){
    //USER = "100000001";

    //COOKIE情報取得
    cookieUpdate();
    if(!cookieData["lang"]){
        document.cookie = "lang="+ BrowserLanguage;        
        cookieUpdate();
    }
    lang = cookieData["lang"];

    //document.cookie = "lang=; max-age=0";

    //PIXIアプリケーション宣言
    app = new PIXI.Application({
        width:width, 
        height:height,
        backgroundColor:0x191919,
    });
    document.getElementById("canvasParent").appendChild(app.renderer.view);

    //マウス位置取得
    app.stage.onmousemove = onmousemove;

    resize();

    // 検証情報を表示
    app.stage.addChild(fpsText);

    startTime = new Date().getTime();
    frameHandler();

    loadJSON("config", "config").then(loadContent => {
        configJSON = JSON.parse(loadContent.data);

        loadJSON("language", "language").then(loadContent => {
            jsonContainer["language"] = JSON.parse(loadContent.data);
            //titleView();
            functionObject["titleView"]();
        }).catch(e => {
            console.log('LANGUAGE LOAD ERROR', e);
        });
    }).catch(e => {
        console.log('CONFIG LOAD ERROR', e);
    });
}

//ループ処理
function frameHandler(){
    update();
    render();
    //フレーム処理
    requestAnimationFrame(frameHandler);
}

//更新処理
function update(){
    frame ++;

    for(let _target of updateTarget){
        _target.update();
    }    

    // 計測
    endTime = new Date().getTime();
    if(endTime - startTime >= 1000){
        fps = frame;
        frame = 0;
        startTime = new Date().getTime();
    }    
}

//レンダー処理
function render(){
    totalFrame++; 
    
    for(let _target of renderTarget){
        _target.render();
    }

    tween.render();

    // 検証情報（FPS・マウス座標）    
    fpsText.text = lang +" "+ fps + " FPS (X:"+ mouseX +", Y:"+ mouseY +")";
    //fpsText.text = lang +" "+ fps + " FPS (X:"+ mouseX +", Y:"+ mouseY +")\n"+ document.cookie;
}

//キャンバス調整
let resize = () => {
    let wid = widRatio*window.innerWidth;//ゲームを表示できる最大横幅
    let hei = heiRatio*window.innerHeight;//ゲームを表示できる最大縦幅
    let x = width;
    let y = height;

    app.stage.scale.x = app.stage.scale.y = 1;//スクリーン幅が十分の時は画面倍率を1にする
    resizeRatio = Math.min(wid/width, hei/height);//横幅と縦幅の、ゲーム画面に対する比のうち小さい方に合わせる

    if(wid < width || hei < height) {//スクリーン幅が足りないとき
        //リサイズ倍率を調整
        x = width*resizeRatio; 
        y = height*resizeRatio; 
        app.stage.scale.x = resizeRatio;
        app.stage.scale.y = resizeRatio;
    }

    canvasParent.style.width = width*resizeRatio +"px";

    app.renderer.resize(x, y);//レンダラーをリサイズ
};

//マウス位置取得
onmousemove = function(e) {
    mouseX = Math.floor(e.offsetX/resizeRatio);
    mouseY = Math.floor(e.offsetY/resizeRatio);  
}


document.body.addEventListener("touchstart", function(e){
    if(e.touches.length >= 2) e.preventDefault();    
}, {passive:false});

document.body.addEventListener("touchmove", function(e){
    if(e.touches.length >= 2) e.preventDefault();
}, {passive:false});

$(window).on("orientationchange", function() {
	resize();
});

$(window).resize(function() {
    resize();
});


