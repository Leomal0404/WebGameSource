functionObject["homeBuild"] = () => {
    homeContent = new Home();
    updateTarget.push(homeContent);
    renderTarget.push(homeContent);    
};

class Home {
    constructor(){
        //背景画像
        //this.backgoundImage = imageContainer["home_bg"];
        this.sceneContainer;

        this.languageContainerList = [];

        this.home_bg;
        this.load();        
    }

    load() {
        //シーンコンテナを生成
        this.sceneContainer = new PIXI.Container();

        this.sceneContainer.addChild(spineContainer["homeImage"]);
        app.stage.addChild(this.sceneContainer);

        //タイトル画面からの遷移の場合はタイトル画面を除去
        if(titleContent != null){
            app.stage.removeChild(spriteContainer["loadingBarFrame"]);
            app.stage.removeChild(spriteContainer["loadingBar"]);
            app.stage.removeChild(spriteContainer["titleImage"]);

            titleContent = null; 
        }

        // 検証情報を表示
        app.stage.removeChild(fpsText);
        app.stage.addChild(fpsText);

        spineContainer["homeImage"].state.setAnimation(0, 'idle', true);

        // クリック・タップをONにする
        spineContainer["homeImage"].interactive = true;

        //画面内デフォルト配置テキスト
        this.languageUpdate();

        //クリック範囲を描画
        for(let areaInfo of jsonContainer["clickArea"]["home"]){
            let clickArea = new PIXI.Graphics();
            clickArea.lineStyle(0, 0x000000, 0);
            clickArea.beginFill(0xff0000, 0.0001);
            // x, y , width, height
            switch(areaInfo.type){
                case "circle":
                    clickArea.drawCircle (areaInfo.augment[0], areaInfo.augment[1], areaInfo.augment[2]);
                    break;
                case "rect":
                    clickArea.drawRect (areaInfo.augment[0], areaInfo.augment[1], areaInfo.augment[2], areaInfo.augment[3]);
                    break;  
            }  
            clickArea.endFill();        
    
            clickArea.name = areaInfo.name;
            clickArea.interactive = true;        
            clickArea.on("click", this.onClick)
            .on("touchstart", this.onClick);
            this.sceneContainer.addChild(clickArea);
        }        

        //イベント通知
        spineContainer["homeImage"].state.addListener({
            event: this.checkEvent
        });

        //１ループの完了通知
        spineContainer["homeImage"].state.addListener({
            complete: this.checkEnd
        });

    }

    //イベント受け取り
    checkEvent = (entry, event) => {
        //console.log(event.data.name, event.intValue);
    };

    //ループ完了受け取り
    checkEnd = (entry) => {
        //console.log(entry);
    };

    //クリック処理
    onClick(e){
        if(e.currentTarget.name == "battleFieldButton"){  
            
            // ジャングルヤードを読み込んだことがなければスクリプト読み込み
            if(typeof JungleYard === 'undefined'){
                $.getScript("./js/jungleYard.js").done(function(script, textStatus){

                    //コンテンツシーン移動
                    contentTransfer("jungleYard", homeContent);

                }).fail(function( jqxhr, settings, exception ) {
                    // エラー時の処理
                });
            }
            else{
                //コンテンツシーン移動
                contentTransfer("jungleYard", homeContent);
            }
        }
        else if(e.currentTarget.name == "heroCustomButton"){
            // キャラクター設定を読み込んだことがなければスクリプト読み込み
            if(typeof HeroList === 'undefined'){
                $.getScript("./js/heroList.js").done(function(script, textStatus){

                    //コンテンツシーン移動
                    contentTransfer("heroList", homeContent);

                }).fail(function( jqxhr, settings, exception ) {
                    // エラー時の処理
                });
            }
            else{
                //コンテンツシーン移動
                contentTransfer("heroList", homeContent);
            }
        }
        else if(e.currentTarget.name == "customButton"){
            document.getElementById('modalWindow').style.pointerEvents = 'auto';
            document.getElementById('modalWindow').style.backgroundColor = 'rgba(0,0,0,0.7)';
            document.getElementById('modal_content').style.display = 'block';
            document.getElementById('generalCloseBtn').style.display = 'block';

            let html = '<p class="modal_title">'+ jsonContainer["language"]["custom"]["option"][lang] +'</p>';
            html += '<select id="languageSelect" name="languageSelect" onchange="homeContent.langSet(this);">';
            for( let _lang in jsonContainer["language"]["custom"]["languages"]){
                let _langInfo = jsonContainer["language"]["custom"]["languages"][_lang];
                html += '<option value="'+ _lang +'"';
                if(_lang == lang) html += ' selected';
                html += '>'+ _langInfo[lang] +'</option>';
            }
            
            html += '</select>';

            document.getElementById('generalInfo').innerHTML = html;
        }
        else if(e.currentTarget.name == "colosseoButton"){
            console.log("コロッセオ移動");
        }
    }

    update(){

    }

    render(){
      
    }

    langSet(e){
        let _idx = e.selectedIndex;
        let _value = e.options[_idx].value;
        
        document.cookie = "lang="+ _value;        
        cookieUpdate();
        lang = _value;

        this.languageUpdate();
    }
    languageUpdate(){
        for(let _part in jsonContainer["language"]["home"]){

            let textInfo = jsonContainer["language"]["home"][_part];

            let _fontSize = 36;
            if(textInfo["size"]) _fontSize = textInfo["size"];
            let _align = "center";
            if(textInfo["align"]) _align = textInfo["align"];

            if(!this.languageContainerList[_part]){
                let text = new PIXI.Text(textInfo[lang], {fontFamily : 'Arial', fontSize:_fontSize, fill : 0xfff9c3, align : _align, wordWrapWidth: 400});
                text.y = textInfo.pos[1];
    
                text.anchor.x = 0.5;
                text.x = textInfo.pos[0];
    
                this.languageContainerList[_part] = text;
                this.sceneContainer.addChild(text);  
            }
            else{
                this.languageContainerList[_part].text = textInfo[lang];
            }                      
        }
    }
}