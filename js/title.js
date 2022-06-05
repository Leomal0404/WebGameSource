// let titleView = () => {
//     titleContent = new Title();
//     updateTarget.push(titleContent);
//     renderTarget.push(titleContent);    
// };

functionObject["titleView"] = () => {
    titleContent = new Title();
    updateTarget.push(titleContent);
    renderTarget.push(titleContent);    
};

class Title {
    constructor(){

        //ロゴ表示完了フラグ
        this.logoFix = false;

        //タイトル読み込み完了フラグ
        this.titleLoaded = false;

        //タイトル表示モード
        this.titleSection = false;

        //ローディングバー進捗モード
        this.progressSection = false;
        this.barRate = 0;

        //タイトル終了フラグ
        this.titleEnd = false;

        //ログイン入力
        this.inputMail;
        this.inputPass;


        //読み込み画像リスト
        this.loadImageList = configJSON.loadImages;

        //読み込みSpineリスト
        this.loadSpineList = configJSON.loadSpines;

        //読み込みJSONリスト
        this.loadJsonList = configJSON.loadJsons;

        //タイトルロゴを見せる時間
        this.titleTime = 120;
        this.titleTimeCount = 0;

        this.init();
    }

    init(){
        //ロゴ画像読み込み
        let _loader = new PIXI.Loader();        
        _loader.add("logoImage", './img/'+ configJSON.logoImage +'?'+ Date.now());
        _loader.load(function(loader,resources){

            // create a spine asset
            let spine = new PIXI.spine.Spine(resources["logoImage"].spineData);
    
            // set the position
            spine.scale.set(1);

            // コンテナに保管
            spineContainer["logoImage"] = spine;
            app.stage.addChild(spineContainer["logoImage"]);

            //１ループの完了通知
            spineContainer["logoImage"].state.addListener({
                complete: titleContent.checkEnd
            });

            //イベント通知
            spineContainer["logoImage"].state.addListener({
                event: titleContent.checkEvent
            });

            // ログイン情報クッキーがなければログイン画面表示
            if(!USER){
                titleContent.buildLogin();
            }
            else{
                //アニメーション再生
                spineContainer["logoImage"].state.setAnimation(0, 'start', false);
                            
                titleContent.titleLoad();
            }            
        });
    }

    onClick(e){
        switch(e.name){
            case "login":
                titleContent.loginHandle();
                break;
            case "register":
                // 新規登録メニューに切り替え
                let html = '<p class="modal_title">'+ jsonContainer["language"]["regist"]["title"][lang] +'</p>';
                html += '<p class="modal_msg">'+ jsonContainer["language"]["regist"]["email"][lang] +'</p>';
                html += '<input id="mailInput" type="email" name="email">';
                html += '<p class="modal_msg">'+ jsonContainer["language"]["regist"]["pass"][lang] +'</p>';
                html += '<input id="passInput" type="text" name="pswrd"  onchange="titleContent.charCheck(this);">';
                html += '<p class="modal_msg">'+ jsonContainer["language"]["regist"]["nickname"][lang] +'</p>';
                html += '<input type="text" name="name">';
                html += '<p class="modal_msg_s">'+ jsonContainer["language"]["regist"]["msg"][lang] +'</p>';

                html += '<div id="alertMsg" class="alertMsg"></div>';
                
                html += '<button name="register" onclick="titleContent.onClick(this);">'+ jsonContainer["language"]["regist"]["register"][lang] +'</button>';
                html += '<button name="back" onclick="titleContent.onClick(this);">'+ jsonContainer["language"]["regist"]["back"][lang] +'</button>';

                document.getElementById('generalInfo').innerHTML = html;

                break;
            case "register":
                
                break;
            case "back":
                titleContent.buildLogin();
                break;
        }
    }

    // ログインメニュー
    buildLogin(){
        document.getElementById('modalWindow').style.pointerEvents = 'auto';
        document.getElementById('modalWindow').style.backgroundColor = 'rgba(0,0,0,0.7)';
        document.getElementById('modal_content').style.display = 'block';
        document.getElementById('generalCloseBtn').style.display = 'none';

        let html = '<p class="modal_title">'+ jsonContainer["language"]["login"]["login"][lang] +'</p>';
        html += '<p class="modal_msg">'+ jsonContainer["language"]["login"]["msg"][lang] +'</p>';
        html += '<p class="modal_msg">'+ jsonContainer["language"]["login"]["email"][lang] +'</p>';

        let mValue = "";
        if(cookieData["lgml"]) mValue = Decrypt(cookieData["lgml"]);
        html += '<input id="mailInput" type="email" name="email" value="'+ mValue +'">';
        html += '<p class="modal_msg">'+ jsonContainer["language"]["login"]["pass"][lang] +'</p>';

        let pValue = "";
        if(cookieData["lgpd"]) pValue = Decrypt(cookieData["lgpd"]);
        html += '<input id="passInput" type="password" name="pswrd" onchange="titleContent.charCheck(this);" value="'+ pValue +'">';

        html += '<div id="alertMsg" class="alertMsg"></div>';

        html += '<button name="login" onclick="titleContent.onClick(this);">'+ jsonContainer["language"]["login"]["login"][lang] +'</button>';
        html += '<button name="register" onclick="titleContent.onClick(this);">'+ jsonContainer["language"]["login"]["register"][lang] +'</button>';

        document.getElementById('generalInfo').innerHTML = html;
    }

    // ログイン処理
    loginHandle(){
        let mail = document.getElementById('mailInput').value;
        let pass = document.getElementById('passInput').value;
        // メールアドレスが正しくない
        if(!this.mailCheckHandle(mail)) return;
        // パスワードが入力されていない
        if(pass.length < 4) return;

        let data = {"mail":mail, "pass":pass};

        this.inputMail = Crypt(mail);
        this.inputPass = Crypt(pass);

        $.ajax({
            type: "POST",       
            data: {'mode':"login", 'data':JSON.stringify(data)},        
            scriptCharset: 'utf-8',
            url: "ajax.php",
            dataType : "json"
        })
        .then(
            function(param){
                //console.log(param.data);
                let _d = JSON.parse(param.data);

                //ログイン成功したらタイトル表示開始
                if(_d.state == "success"){
                    document.cookie = "lgml="+ titleContent.inputMail;
                    document.cookie = "lgpd="+ titleContent.inputPass;
                    cookieUpdate();
                    USER = _d.user;

                    closeModal();

                    //アニメーション再生
                    spineContainer["logoImage"].state.setAnimation(0, 'start', false);
                                
                    titleContent.titleLoad();
                }
                else{
                    titleContent.loginError();
                }
            },
            function(XMLHttpRequest, textStatus, errorThrown){
                console.log(XMLHttpRequest);
        });
    }
    loginError(){
        document.getElementById('alertMsg').innerHTML = jsonContainer["language"]["login"]["loginError"][lang];
    }

    titleLoad(){        
        //タイトル画像およびローディング画面読み込み
        let _loader = new PIXI.Loader();
        //_loader.reset();
        _loader.add("titleImage", './img/'+ configJSON.titleImage +'?'+ Date.now());
        _loader.add("loading", './img/'+ configJSON.loading +'?'+ Date.now());
        _loader.load(function(loader,resources){
            //Spriteを生成                    
            let sprite = new PIXI.Sprite.from(resources["titleImage"].texture);

            // コンテナに保管
            spriteContainer["titleImage"] = sprite;

            // create a spine asset
            let spine = new PIXI.spine.Spine(resources["loading"].spineData);

            // コンテナに保管
            spineContainer["loading"] = spine;

            //アニメーション再生
            spineContainer["loading"].state.setAnimation(0, 'idle', true);

            //タイトル画像読み込み完了
            titleContent.titleLoaded = true;

            titleContent.loadFiles();            
        });
    }

    loadFiles(){
        //必須画像とSpineの読み込み
        let _loader = PIXI.Loader.shared;
        //let _loader = new PIXI.Loader();
        //_loader.reset();

        for(let _imgName in this.loadImageList) {
            //読み込みリストに追加
            let _imgPath = this.loadImageList[_imgName];
            _loader.add(_imgName, './img/'+ _imgPath +'?'+ Date.now());
        }
        for(let _spineName in this.loadSpineList) {
            //読み込みリストに追加            
            let _spinePath = this.loadSpineList[_spineName];
            _loader.add(_spineName, './img/'+ _spinePath +'?'+ Date.now());
        }
        _loader.onProgress.add(function(loader, resource){
            loadProgress =  Math.ceil(loader.progress); 
        });

        //読み込み実行
        _loader.load(function(loader,resources){
            $.each(resources,function(name,resource){
                if(name.indexOf("_spine") > 1){
                    if(resource.url.indexOf('.json') > 1){
                        let _sName = name.split("_spine")[0];

                        let spine = new PIXI.spine.Spine(resource.spineData);
                        // コンテナに保管
                        spineContainer[_sName] = spine;

                        spineRawData[_sName] = resource.spineData;
                    }
                }
                else{
                    //Textureを取得                    
                    let texture = resource.texture;

                    // コンテナに保管
                    textureContainer[name] = texture;
                }
            });
        });


        //必須JSONの読み込み
        for(let _jsonName in this.loadJsonList) {

            let _jsonPath = this.loadJsonList[_jsonName];

            loadJSON(_jsonName, _jsonPath).then(loadContent => {
                
                jsonContainer[_jsonName] = JSON.parse(loadContent.data);
                //if(this.loadedCount == this.loadCount) console.log("読み込み完了");
            }).catch(e => {
                console.log('onload error', e);
            });
        }

        //アカウントデータ読み込み(テスト用)
        loadAccountJSON("userData", USER).then(loadContent => {  
            jsonContainer["userData"] = JSON.parse(loadContent.data);
            //if(this.loadedCount == this.loadCount) console.log("読み込み完了");
        }).catch(e => {
            console.log('Account Data Error', e);
        });
    }

    //ループ完了受け取り
    checkEnd = (entry) => {
        //ロゴ表示完了フラグ
        titleContent.logoFix = true;
    };

    //イベント受け取り
    checkEvent = (entry, event) => {
        if(event.data.name == "logoOut"){
            titleContent.titleSection = true;
        }
    };

    update(){
        if(this.barRate == 1 && this.progressSection == false && spriteContainer["titleImage"] && this.titleEnd === false){

            this.titleTimeCount++;

            if(this.titleTimeCount >= this.titleTime){
                this.titleEnd = true;

                $.getScript("./js/home.js").done(function(script, textStatus){
                    for(let i = 0; i < updateTarget.length; i++){
                        if(updateTarget[i] == titleContent)  updateTarget.splice(i, 1);
                    }
                    for(let i = 0; i < renderTarget.length; i++){
                        if(renderTarget[i] == titleContent)  renderTarget.splice(i, 1);
                    }
    
                    resize();
    
                    //ホーム画面に移動
                    functionObject["homeBuild"]();
                    //homeBuild();
                }).fail(function( jqxhr, settings, exception ) {
                    // エラー時の処理
                });
            }          
        }
    }

    render(){
        //ロゴの表示、タイトルの読み込みが完了したらロゴをフェードアウト
        if(this.logoFix === true && this.titleLoaded === true){

            this.logoFix = false;
            this.titleLoaded = false;

            //アニメーション再生
            spineContainer["logoImage"].state.setAnimation(0, 'titleLoaded', false);
        }
        else if(this.titleSection === true){

            this.titleSection = false;

            //ローディング画面表示
            app.stage.addChild(spineContainer["loading"]);

            //タイトル画面表示
            app.stage.addChild(spriteContainer["titleImage"]);

            //ロゴ画面除去
            app.stage.removeChild(spineContainer["logoImage"]);


            //ローディングバーフレーム
            // 角丸四角形を描く
            let roundBox = new PIXI.Graphics();
            roundBox.lineStyle(7, 0x656251, 1);
            roundBox.beginFill(0x000000, 0.5);

            // drawRoundedRect(x, y, width, height, cornerRadius)
            roundBox.drawRoundedRect(0, 0, 1800, 60, 15)
            roundBox.endFill();

            // 位置（四角の左上が基準として）
            roundBox.x = 60 + 290;
            roundBox.y = 950;
            app.stage.addChild(roundBox);

            spriteContainer["loadingBarFrame"] = roundBox;

            //ローディングバー
            // 角丸四角形を描く
            let loadingBar = new PIXI.Graphics();
            app.stage.addChild(loadingBar);
            spriteContainer["loadingBar"] = loadingBar;

            app.stage.removeChild(fpsText);
            app.stage.addChild(fpsText);

            resize();

            this.progressSection = true;

        }
        else if(this.progressSection === true){
            let progressRate = loadProgress / 100;

            if(this.barRate + 0.01 < progressRate) this.barRate += 0.01;
            else this.barRate = progressRate;

            spriteContainer["loadingBar"].clear();
            spriteContainer["loadingBar"].lineStyle(0, 0x656251, 0);
            spriteContainer["loadingBar"].beginFill(0x0a901a, 1);

            // drawRoundedRect(x, y, width, height, cornerRadius)
            spriteContainer["loadingBar"].drawRoundedRect(4, 4, Math.floor(1792 * this.barRate), 52, 15)
            spriteContainer["loadingBar"].endFill();

            // 位置（四角の左上が基準として）
            spriteContainer["loadingBar"].x = 60 + 290;
            spriteContainer["loadingBar"].y = 950;

            if(this.barRate == 1) this.progressSection = false;
        }
    }

    mailCheck(e){
        this.mailCheckHandle(e.value);        
    }
    mailCheckHandle(str){
        /*メールアドレスのパターン 正規表現*/
        let pattern = /^[A-Za-z0-9]{1}[A-Za-z0-9_.-]*@{1}[A-Za-z0-9_.-]+.[A-Za-z0-9]+$/;

        /*メールアドレスのパターンにマッチするかチェック*/
        if (pattern.test(str)) {
            /*パターンにマッチした場合*/
            return true;
        } else {
            /*パターンにマッチしない場合*/
            document.getElementById('alertMsg').innerHTML = jsonContainer["language"]["regist"]["mailAlert"][lang];
            return false;
        }
    }

    charCheck(e){
        let preString = e.value;      
        let str = preString;

        //全角を除去する
        str = str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
            return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
        });
        str = str.replace( /[^!-~]/g , "" );

        e.value = str;

        let error = "";
        if(str != preString) error = jsonContainer["language"]["regist"]["passAlert"][lang];
            
        document.getElementById('alertMsg').innerHTML = error;
    }
}