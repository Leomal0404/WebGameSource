functionObject["heroList"] = () => {
    heroListContent = new HeroList();
    updateTarget.push(heroListContent);
    renderTarget.push(heroListContent);    
};

class HeroList {
    constructor(){
        // シーンアセットを配置するコンテナ
        this.sceneContainer;

        // 背景SPINE用コンテナ
        this.bgContainer;

        // 所有キャラクターコンテナリスト
        this.myHeroContainerList = [];


        // 文字列情報コンテナ
        this.languageContainerList = {};

        // キャラクター一覧用のコンテナ
        this.heroListContainer;

        //読み込み必要キャラクターID配列
        this.needleHeroID = [];

        this.load();
    }

    load() {
        // 必要キャラクターSpineの洗い出し
        for(let _hero of jsonContainer["userData"]['hero']){
            //キャラクターID
            let _id = _hero['id'];

            //必要キャラクターIDに登録
            if(this.needleHeroID.indexOf(_id) === -1 && !(_id in ownHeroSpineContainer)) this.needleHeroID.push(_id);
        }

        // 必要キャラクターSpineの読み込み
        if(this.needleHeroID.length > 0){
            let timeCode = Date.now();
            let _loader = PIXI.Loader.shared;
            PIXI.utils.clearTextureCache();
            _loader.reset();
            for(let _id of this.needleHeroID){
                _loader.add(_id +"_own", './img/999_chara/'+ _id +'/'+ _id +'.json?'+ timeCode);
                _loader.add(_id +"_fx_own", './img/999_chara/'+ _id +'_fx/'+ _id +'_fx.json?'+ timeCode);
            }
            _loader.load(this.onAssetsLoaded);
        }
        else this.init();
    }

    //必要キャラクター読み込み完了
    onAssetsLoaded(loader, res) {
        //Spineデータ保持
        for(let _hero of jsonContainer["userData"]['hero']){

            //キャラクターID
            let _id = _hero['id'];

            // Spine読み込みデータがある場合
            if(res[_id +"_own" ]){
                let spine = new PIXI.spine.Spine(res[_id +"_own" ].spineData);
                // 読み込み済キャラSpine配列に格納
                ownHeroSpineContainer[_id] = spine;

                let spine_fx = new PIXI.spine.Spine(res[_id +"_fx_own" ].spineData);
                // 読み込み済キャラSpine配列に格納
                ownHeroSpineContainer[_id +"_fx_own"] = spine_fx;
            }
        }
        heroListContent.init();
    }

    init(){
        //シーンコンテナを生成
        this.sceneContainer = new PIXI.Container();

        //キャラクター一覧用のコンテナ
        this.heroListContainer = new PIXI.Container();
        this.heroListContainer.x = 725;
        this.heroListContainer.y = 160;

        //所持キャラクター情報
        let _myHeroes = jsonContainer["userData"]["hero"];
        for(let i = 0; i < _myHeroes.length; i++){
            // アイコン生成
            let _container = buildHeroIcon( _myHeroes[i]);

            _container.x = (i % 2) * 645 + (i % 2) * 15;
            _container.y = Math.floor( i / 2) * 145;            
            _container.scale.x = _container.scale.y = 1.25;

            _container.interactive = true;
            _container.on("touchstart", this.buildCustomPageHandler)
            .on('click',  this.buildCustomPageHandler);
     

            this.heroListContainer.addChild(_container);

            this.myHeroContainerList.push(_container);


            //キャラクター名表記
            let _name = jsonContainer["heroData"][_myHeroes[i].id]['name'][lang];
            let text = new PIXI.Text(_name, {fontFamily : 'Arial', fontSize:36, fill : 0xffffff, align : "left", wordWrapWidth: 400});
            text.x = _container.x + 175;
            text.y = _container.y + 10;
            this.heroListContainer.addChild(text);
        }


        // 背景SPINE配置
        this.bgContainer = new PIXI.Container();
        this.bgContainer.addChild(spineContainer["ui"]);
        spineContainer["ui"].state.setAnimation(0, 'heroList', true);
        this.sceneContainer.addChild(this.bgContainer); 

        //キャラクター一覧用のコンテナ配置
        this.sceneContainer.addChild(this.heroListContainer);


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

    buildCustomPageHandler(e){
        heroListContent.buildCustomPage(e.target.name);
    }

    buildCustomPage(_id){
        // キャラクター設定を読み込んだことがなければスクリプト読み込み
        if(typeof HeroCustom === 'undefined'){
            $.getScript("./js/heroCustom.js").done(function(script, textStatus){

                //コンテンツシーン移動
                contentTransfer("heroCustom", heroListContent, _id);

            }).fail(function( jqxhr, settings, exception ) {
                // エラー時の処理
            });
        }
        else{
            //コンテンツシーン移動
            contentTransfer("heroCustom", heroListContent, _id);
        }
    }
    
    onClick(e){
        if(e.currentTarget.name == "backButton"){
            //コンテンツシーン移動
            contentTransfer("homeBuild", heroListContent);
        }
    }

    //文字情報配置
    languageUpdate(){
        for(let _part in jsonContainer["language"]["heroList"]){

            let textInfo = jsonContainer["language"]["heroList"][_part];

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
        for(let areaInfo of jsonContainer["clickArea"]["heroList"]){
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
    }
}
