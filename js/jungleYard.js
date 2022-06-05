functionObject["jungleYard"] = () => {
    jungleContent = new JungleYard();
    updateTarget.push(jungleContent);
    renderTarget.push(jungleContent);    
};

class JungleYard {
    constructor(){
        //シーンアセットを配置するコンテナ
        this.sceneContainer;

        // 背景コンテナ
        this.bgContainer;

        // ステージ位置配列
        this.stagePointList = [
            [856,925],
            [540,810],
            [305,630],
            [223,432],
            [517,363],
            [776,449],
            [960,500],
            [1040,350],
            [1150,210],
            [1036,115]
        ];


        this.load();
    }

    load() {     
        //シーンコンテナを生成
        this.sceneContainer = new PIXI.Container();

        // MAP背景spine
        this.bgContainer = new PIXI.Container();
        this.bgContainer.addChild(spineContainer["map01"]);
        spineContainer["map01"].state.setAnimation(0, 'idle', true);
        this.sceneContainer.addChild(this.bgContainer);

        //ステージポイント構築
        for(let i = 0; i < this.stagePointList.length; i++){
            let rank = jsonContainer["userData"]["stageLevel"] % 10;
            let garde = jsonContainer["userData"]["stageLevel"] - rank;
            this.buildStagePoint(i, garde);
        }


        //文字情報配置
        this.languageUpdate();
        //クリックエリア構築
        this.buildClickArea();

        //シーンコンテナをステージに配置
        app.stage.addChild(this.sceneContainer);

        // 検証情報を表示
        app.stage.removeChild(fpsText);
        app.stage.addChild(fpsText);
    }

    //毎フレーム処理
    update(){

    }

    render(){
      
    }

    // ステージポイント構築
    buildStagePoint(_index, _garde){
        let stageLevel = _garde + (_index + 1);

        let stagePointContainer = new PIXI.Container();
        let stagePoint = new PIXI.spine.Spine(spineRawData["map01"]);
        
        if(stageLevel == jsonContainer["userData"]["stageLevel"]){
            stagePoint.state.setAnimation(0, 'stagePoint_activate', false);
            stagePoint.state.addAnimation(0, 'stagePoint_active', true, 0);

            stagePointContainer.interactive = true;        
            stagePointContainer.on("click", this.onClick)
            .on("touchstart", this.onClick);
        }
        else if(stageLevel > jsonContainer["userData"]["stageLevel"]){
            stagePoint.state.setAnimation(0, 'stagePoint_unlock', true);
        }
        else if(stageLevel < jsonContainer["userData"]["stageLevel"]){
            stagePoint.state.setAnimation(0, 'stagePoint_idle', true);
        }
        

        stagePointContainer.addChild(stagePoint);

        let lvFrame = new PIXI.Sprite();
        lvFrame.texture = new PIXI.Texture(textureContainer["frames"], new PIXI.Rectangle(0, 390, 86, 43));
        stagePointContainer.addChild(lvFrame);
        lvFrame.scale.x = lvFrame.scale.y = 1.25;
        lvFrame.x = -1 * lvFrame.width / 2;
        lvFrame.y = 35;        

        //レベル
        let text = new PIXI.Text( stageLevel, {fontFamily : 'Arial', fontSize: 28, fill : 0xfff9c3, align : 'center', wordWrapWidth: 100});
        text.anchor.x = 0.5;
        text.x = 0;
        text.y = 42;
        stagePointContainer.addChild(text);

        stagePointContainer.x = this.stagePointList[_index][0];
        stagePointContainer.y = this.stagePointList[_index][1];


        this.sceneContainer.addChild(stagePointContainer);
    }

    onClick(e){
        if(e.currentTarget.name == "backButton"){
            //コンテンツシーン移動
            contentTransfer("homeBuild", jungleContent);
        }
        else{

            if(jsonContainer["userData"]["teams"][ jsonContainer["userData"]["activeTeam"] ]['team'].length > 0){
                // バトル設定を読み込んだことがなければスクリプト読み込み
                if(typeof BattleSetting === 'undefined'){
                    $.getScript("./js/battleSetting.js").done(function(script, textStatus){

                        //コンテンツシーン移動
                        contentTransfer("battleSetting", jungleContent);

                    }).fail(function( jqxhr, settings, exception ) {
                        // エラー時の処理
                    });
                }
                else{
                    //コンテンツシーン移動
                    contentTransfer("battleSetting", jungleContent);
                }
            }
            else{
                console.log("バトル参加メンバーがいない");
            }
            
        }
    }

    //文字情報配置
    languageUpdate(){
        for(let _part in jsonContainer["language"]["jungleYard"]){

            let textInfo = jsonContainer["language"]["jungleYard"][_part];

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
    //クリックエリア構築
    buildClickArea(){
        //クリック範囲を描画
        for(let areaInfo of jsonContainer["clickArea"]["jungleYard"]){
            let clickArea = new PIXI.Graphics();
            clickArea.lineStyle(0, 0x000000, 0);
            clickArea.beginFill(0xff0000, 0.00001);
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
    }
}