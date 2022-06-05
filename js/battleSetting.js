functionObject["battleSetting"] = () => {
    settingContent = new BattleSetting();
    updateTarget.push(settingContent);
    renderTarget.push(settingContent);    
};

class BattleSetting {
    constructor(){
        //シーンアセットを配置するコンテナ
        this.sceneContainer;

        //背景SPINE用コンテナ
        this.bgContainer;


        //配置キャラクターコンテナリスト
        this.setHeroContainerList = [];

        //所有キャラクターコンテナリスト
        this.myHeroContainerList = [];


        //文字列情報コンテナ
        this.languageContainerList = {};

        //キャラクター一覧用のコンテナ
        this.heroListContainer;

        //戦場配置設定用のコンテナ
        this.placementContainer;

        //配置用テーブルのブロックサイズ
        this.placeBlockWidth = 160;
        this.placeBlockHeight = 145;

        //
        this.dragFlag = false;
        this.dragTarget = null;
        this.tapData;

        this.load();
    }

    load() {     
        //シーンコンテナを生成
        this.sceneContainer = new PIXI.Container();

        //キャラクター一覧用のコンテナ
        this.heroListContainer = new PIXI.Container();
        this.heroListContainer.x = 925;
        this.heroListContainer.y = 655;

        //戦場配置設定用のコンテナ
        this.placementContainer = new PIXI.Container();
        this.placementContainer.x = 1205;
        this.placementContainer.y = 100;


        //チーム配置情報を形成
        for(let i = 0; i < jsonContainer["userData"]["teams"][ jsonContainer["userData"]["activeTeam"] ]['team'].length; i++){
            //キャラクターアイコン作成
            this.buildPlacementIcon(i);
        }

        //所持キャラクター情報
        let _myHeroes = jsonContainer["userData"]["hero"];
        for(let i = 0; i < _myHeroes.length; i++){
            // アイコン生成
            let _container = buildHeroIcon( _myHeroes[i]);

            _container.x = (i % 6) * 145 + (i % 6) * 15;
            _container.y = Math.floor( i / 6) * 145;            

            _container.interactive = true;
            _container.on("touchstart", this.memberSwitch)
            .on('click',  this.memberSwitch);


            this.heroListContainer.addChild(_container);

            this.myHeroContainerList.push(_container);
        }


        // バトルUI用SPINE配置
        this.bgContainer = new PIXI.Container();
        this.bgContainer.addChild(spineContainer["ui"]);
        spineContainer["ui"].state.setAnimation(0, 'battleSetting', true);
        this.sceneContainer.addChild(this.bgContainer); 

        //戦場配置設定用のコンテナ配置
        this.sceneContainer.addChild(this.placementContainer);

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
    
    onClick(e){
        if(e.currentTarget.name == "backButton"){
            //コンテンツシーン移動
            contentTransfer("jungleYard", settingContent);
        }
        else if(e.currentTarget.name == "startButton"){

            if(jsonContainer["userData"]["teams"][ jsonContainer["userData"]["activeTeam"] ]['team'].length > 0){
                // バトル設定を読み込んだことがなければスクリプト読み込み
                if(typeof Battle === 'undefined'){
                    $.getScript("./js/battleField.js").done(function(script, textStatus){

                        //コンテンツシーン移動
                        contentTransfer("battleField", settingContent);

                    }).fail(function( jqxhr, settings, exception ) {
                        // エラー時の処理
                    });
                }
                else{
                    //コンテンツシーン移動
                    contentTransfer("battleField", settingContent);
                }
            }
            else{
                console.log("バトル参加メンバーがいない");
            }
            
        }
    }

    //配備設定リスト用のキャラクターサムネ作成
    buildPlacementIcon(i){
        let _id = jsonContainer["userData"]["teams"][ jsonContainer["userData"]["activeTeam"] ]['team'][i];

        let _pos = jsonContainer["userData"]["teams"][ jsonContainer["userData"]["activeTeam"] ]['pos'][i];

        //ユーザーキャラクター情報から該当IDのキャラ情報を取得
        let myHeroInfo = jsonContainer["userData"]['hero'].find((v) => v.id === _id);

        let _type = myHeroInfo['type'];

        //サムネイルテクスチャ
        let thum = new PIXI.Sprite();
        let thumRect = jsonContainer[_type +"Data"][_id]['thum'];
        thum.texture = new PIXI.Texture(textureContainer["hero_thum"], new PIXI.Rectangle(thumRect[0], thumRect[1], thumRect[2], thumRect[3]));
        thum.scale.x = -1;
        thum.x = thum.width;

        let _container = new PIXI.Container();
        _container.addChild(thum);

        this.setPlacement(_container, _pos[0], _pos[1]);

        _container.name = _id;

        _container.interactive = true;

        //ドラッグ処理
        _container.on('pointerdown', this.dragStart)
        .on('touchstart', this.dragStart)
        .on('pointerup', this.dragEnd)
        .on('mouseupoutside', this.dragEnd)
        .on('touchend', this.dragEnd)
        .on('touchendoutside', this.dragEnd)
        .on('mousemove', this.dragHandler)
        .on('touchmove', this.dragHandler);

        this.placementContainer.addChild(_container);
        this.setHeroContainerList.push(_container);
    }

    //リストタップによるメンバーの登録・解除
    memberSwitch(e){
        //入れ替え処理
        settingContent.memberSwitchHandler(e.currentTarget.name);
    }

    memberSwitchHandler(_targetID){
        //チーム配備されているかどうか
        let targetIndex = jsonContainer["userData"]["teams"][ jsonContainer["userData"]["activeTeam"] ]['team'].indexOf(_targetID);

        // 配備されている場合はチームから除去する
        if(targetIndex > -1){
            jsonContainer["userData"]["teams"][ jsonContainer["userData"]["activeTeam"] ]['team'].splice(targetIndex, 1);
            jsonContainer["userData"]["teams"][ jsonContainer["userData"]["activeTeam"] ]['pos'].splice(targetIndex, 1);
            let _targetContainer = this.setHeroContainerList[targetIndex];
            this.placementContainer.removeChild(_targetContainer);
            this.setHeroContainerList.splice(targetIndex, 1);
            _targetContainer = null;
        }
        // 未配備キャラクターの場合はチームに追加
        else{
            jsonContainer["userData"]["teams"][ jsonContainer["userData"]["activeTeam"] ]['team'].push(_targetID);
            //空いているポジションに配置
            for(let i = 0; i < 4; i++){
                let _posX = Math.floor(i / 3);
                let _posY = i % 3;
                let wFlag = false;
                for(let _pos of jsonContainer["userData"]["teams"][ jsonContainer["userData"]["activeTeam"] ]['pos']){
                    if(_posX == _pos[0] && _posY == _pos[1]){
                        wFlag = true;
                        break;
                    } 
                }
                //重複しないポジションに配備
                if(wFlag === false){
                    let _newPos = [_posX, _posY];
                    jsonContainer["userData"]["teams"][ jsonContainer["userData"]["activeTeam"] ]['pos'].push(_newPos);
                    this.buildPlacementIcon((jsonContainer["userData"]["teams"][ jsonContainer["userData"]["activeTeam"] ]['pos'].length - 1));
                    break;
                }
            }
        }
        //アカウントデータ更新
        saveAcountJSON();
    }

    dragStart(e) {
        //console.log("dragStart"+ e.currentTarget.name, e.currentTarget.parent.x);

        settingContent.dragTarget = e.target;

        settingContent.tapData = e.data;        
        settingContent.dragFlag = true;  
        
        let newPosition = settingContent.tapData.getLocalPosition(settingContent.dragTarget.parent);
        settingContent.dragTarget.x = newPosition.x - settingContent.dragTarget.width/2;
        settingContent.dragTarget.y = newPosition.y - settingContent.dragTarget.height/2;

        settingContent.placementContainer.removeChild(settingContent.dragTarget);
        settingContent.placementContainer.addChild(settingContent.dragTarget);
    }

    dragHandler() {
        //console.log(e.data.global);
        //settingContent.touchX = mouseX;
        //settingContent.touchY = mouseY;
        if(settingContent.dragFlag === true){
            let newPosition = settingContent.tapData.getLocalPosition(settingContent.dragTarget.parent);

            let newPosX = newPosition.x - settingContent.dragTarget.width/2;
            let newPosY = newPosition.y - settingContent.dragTarget.height/2;

            let leftEdge = settingContent.dragTarget.width/2 * -1;
            let topEdge = settingContent.dragTarget.height/2 * -1;
            let rightEdge = 500 + settingContent.dragTarget.width/2;
            let bottomEdge = 350 + settingContent.dragTarget.height/2;
            
            if(newPosX < leftEdge || newPosY < topEdge || newPosX > rightEdge || newPosY > bottomEdge){
                
                if(newPosX < leftEdge) newPosX = 0;
                if(newPosY < topEdge) newPosY = 0;
                if(newPosX > rightEdge) newPosX = 500;
                if(newPosY > bottomEdge) newPosY = 350;

                settingContent.dragTarget.x = newPosX;
                settingContent.dragTarget.y = newPosY;

                settingContent.dragEnd();

                return;
            }

            settingContent.dragTarget.x = newPosX;
            settingContent.dragTarget.y = newPosY;
        }
    }

    dragEnd() {
        //console.log("dragEnd"+ e.currentTarget.name);
        settingContent.dragEndHandler();        
    }

    dragEndHandler() {
        if(settingContent.dragFlag === true){
            this.dragFlag = false;
            this.tapData = null;
    
            if(this.dragTarget.x < 0) this.dragTarget.x = 0;
            if(this.dragTarget.y < 0) this.dragTarget.y = 0;
            if(this.dragTarget.x > 500) this.dragTarget.x = 500;
            if(this.dragTarget.y > 350) this.dragTarget.y = 350;
    
            this.setPlacement(this.dragTarget);
        }
    }

    setPlacement(_target, _posX = null, _posY = null){
        //console.log(Math.floor(_target.x / this.placeBlockWidth), Math.floor(_target.y / this.placeBlockHeight));

        if(_posX === null) _posX = 3 - Math.floor( (_target.x + _target.width/2) / this.placeBlockWidth);
        if(_posY === null) _posY = Math.floor( (_target.y + _target.height/2) / this.placeBlockHeight);

        _target.x = (3 -_posX) * this.placeBlockWidth;
        _target.y = _posY * this.placeBlockHeight;

        //設定操作完了処理
        if(this.dragTarget != null){     
            //移動したキャラクターのチーム情報インデックス
            let targetIndex = jsonContainer["userData"]["teams"][ jsonContainer["userData"]["activeTeam"] ]['team'].indexOf(_target.name);

            let setPos = jsonContainer["userData"]["teams"][ jsonContainer["userData"]["activeTeam"] ]['pos'][targetIndex];
            //位置が変わってない場合は配備を解除
            if(_posX == setPos[0] && _posY == setPos[1]){
                this.memberSwitchHandler(_target.name);
                this.dragTarget = null;
                return;
            }

            // 該当場所にすでに別のキャラクターがいる場合は隣にずらす
            let checkX = _posX;
            let checkY = _posY;
            for(let i in jsonContainer["userData"]["teams"][ jsonContainer["userData"]["activeTeam"] ]['pos']){
                if(i == targetIndex) continue;

                let _posInfo = jsonContainer["userData"]["teams"][ jsonContainer["userData"]["activeTeam"] ]['pos'][i];
                
                //すでに配置されている場合
                if(_posInfo[0] == checkX && _posInfo[1] == checkY){
                    if(checkX < 3){
                        checkX++;
                    }
                    else{
                        checkX--;
                    }

                    // X位置をずらした上で再度重複チェック
                    for(let j in jsonContainer["userData"]["teams"][ jsonContainer["userData"]["activeTeam"] ]['pos']){
                        if(j == targetIndex) continue;
    
                        let _posInfo = jsonContainer["userData"]["teams"][ jsonContainer["userData"]["activeTeam"] ]['pos'][j];
                        
                        //すでに配置されている場合
                        if(_posInfo[0] == checkX && _posInfo[1] == checkY){
                            if(checkY < 2){
                                checkX = _posX;
                                checkY++;
                            }
                            else{
                                checkX = _posX;
                                checkY--;
                            }

                            // Y位置をずらした上で最後に重複チェック
                            for(let k in jsonContainer["userData"]["teams"][ jsonContainer["userData"]["activeTeam"] ]['pos']){
                                if(k == targetIndex) continue;
            
                                let _posInfo = jsonContainer["userData"]["teams"][ jsonContainer["userData"]["activeTeam"] ]['pos'][k];
                                
                                //すでに配置されている場合
                                if(_posInfo[0] == checkX && _posInfo[1] == checkY){
                                    if(checkX < 3){
                                        checkX++;
                                    }
                                    else{
                                        checkX--;
                                    }
                                    break;
                                }
                            }
                            break;
                        }
                    }
                    break;
                }
            }

            _target.x = (3 - checkX) * this.placeBlockWidth;
            _target.y = checkY * this.placeBlockHeight;

            //位置情報を更新
            jsonContainer["userData"]["teams"][ jsonContainer["userData"]["activeTeam"] ]['pos'][targetIndex][0] = checkX;
            jsonContainer["userData"]["teams"][ jsonContainer["userData"]["activeTeam"] ]['pos'][targetIndex][1] = checkY;

            //アカウントデータ更新
            saveAcountJSON();

            this.dragTarget = null;
        }    
    }

    //文字情報配置
    languageUpdate(){
        for(let _part in jsonContainer["language"]["battleSetting"]){

            let textInfo = jsonContainer["language"]["battleSetting"][_part];

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
        for(let areaInfo of jsonContainer["clickArea"]["battleSetting"]){
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
