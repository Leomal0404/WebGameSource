functionObject["heroCustom"] = (id) => {
    heroCustomContent = new HeroCustom(id);
    updateTarget.push(heroCustomContent);
    renderTarget.push(heroCustomContent);    
};

let HeroCustom = class {
    constructor(id){
        // シーンコンテナ
        this.sceneContainer = new PIXI.Container();

        // 背景Spine
        this.stageSpine;

        // 表示キャラクターID
        this.id = id;
        this.heroInfo;
        this.myHeroStatus;
        this.heroSpineContainer = new PIXI.Container();

        // 表示ページ
        this.viewPage = "status";

        // 文字列情報コンテナ
        this.languageContainerList = {};


        // ステータスページコンテナ
        this.statusContainer = new PIXI.Container();
        this.viewStatus = [
            "hp",
            "strength",
            "agility",
            "intelligence",
            "physicalAttack",
            "physicalArmor",
            "magicalAttack",
            "magicalArmor",
            "critical",
            "dodge",
            "physicalPenetration",
            "magicalPenetration",
            "attackSpeed",
            "walkSpeed"
        ];

        // スキルページコンテナ
        this.skillContainer = new PIXI.Container();

        // 習得済みスキルアイコンテクスチャ配列
        this.skillTextureList = {};

        // スキルスロットのサムネスプライト配列
        this.skillSlotSpriteList = [];
        this.skillSlotSpritePlateList = [];

        // スキルボックスリスト
        this.skillBoxList = [];

        // 強化ウィンドウ
        this.forceWindow;
        this.forceWindowSpine;
        this.forceTargetContainer;
        this.forceRequiredContainer;
        this.forceWindowTitle;
        this.forceWindowLevel

        // ページコンテナ配列
        this.pageContainerList = {
            "status":this.statusContainer,
            "skill":this.skillContainer
        };

        this.load();
    }

    load() {
        
        // 背景Spineをシーンに配置
        this.stageSpine = spineContainer["ui"];
        this.stageSpine.interactive = true;
        this.stageSpine.state.setAnimation(0, 'heroCustom', true);
        this.sceneContainer.addChild(this.stageSpine);

        // キャラクター情報、ステータス取得
        this.heroInfo = jsonContainer["userData"]["hero"].find((v) => v.id === this.id);
        this.myHeroStatus = getStatusInfo(this.id, this.heroInfo);

        // 名前表示
        let _name = jsonContainer["heroData"][this.id]['name'][lang];
        let text = new PIXI.Text(_name, {fontFamily : 'Arial', fontSize:42, fill : 0xffffff, align : "center", wordWrapWidth: 400});
        text.anchor.x = 0.5;
        text.x = 1770;
        text.y = 60;
        this.sceneContainer.addChild(text);

        //キャラクターSpineを配置        
        this.heroSpineContainer.addChild(ownHeroSpineContainer[this.id]);
        ownHeroSpineContainer[this.id].skeleton.scaleX = 1;
        ownHeroSpineContainer[this.id].state.setAnimation(0, 'idle', true);

        this.heroSpineContainer.scale.x = this.heroSpineContainer.scale.y = 1.5;
        this.heroSpineContainer.x = 1770;
        this.heroSpineContainer.y = 500;
        this.sceneContainer.addChild( this.heroSpineContainer);

        //習得済みスキルのテクスチャをひととおり格納しておく
        for(let i = 0; i < this.heroInfo["skillAquired"].length; i++){
            //スキルID
            let skillID = this.heroInfo["skillAquired"][i]['id'];

            //スキル情報
            let skillInfo = jsonContainer["heroData"][this.id]["skill"].find((v) => v.id === skillID);

            //サムネイル矩形
            let _rect = skillInfo["thum"]["rect"];

            let _texture = new PIXI.Texture(textureContainer[skillInfo["thum"]["img"]], new PIXI.Rectangle(_rect[0], _rect[1], _rect[2], _rect[3]));

            this.skillTextureList[skillID] = _texture;
        }

        //キャラクターレベル表記
        let levelAreaContainer = new PIXI.Container();
        levelAreaContainer.x = 1550;
        levelAreaContainer.y = 580;

        // EXPロゴ
        let expLogo = new PIXI.Sprite();
        expLogo.scale.x = expLogo.scale.y = 1.5;
        let expLogoRect = jsonContainer['framesAtlas']["expicon"];
        expLogo.texture = new PIXI.Texture(textureContainer["frames"], new PIXI.Rectangle(expLogoRect[0], expLogoRect[1], expLogoRect[2], expLogoRect[3]));
        levelAreaContainer.addChild(expLogo);

        //フレーム
        let expFrame = new PIXI.Sprite(); 
        expFrame.x = 100;
        expFrame.y = 50;
        expFrame.scale.x = expFrame.scale.y = 1.5;
        let expFrameRect = jsonContainer['framesAtlas']["expframe"];
        expFrame.texture = new PIXI.Texture(textureContainer["frames"], new PIXI.Rectangle(expFrameRect[0], expFrameRect[1], expFrameRect[2], expFrameRect[3]));
        levelAreaContainer.addChild(expFrame);

        // レベル
        let lvText = new PIXI.Text(jsonContainer["language"]["heroCustom"]["force"]["lv"][lang] +" : "+ this.heroInfo['lv'], {fontFamily : 'Arial', fontSize:36, fill : 0xfff9c3, align : "left", wordWrapWidth: 400});
        lvText.anchor.x = 0.5;
        lvText.x = expFrame.x + expFrame.width / 2;
        lvText.y = 5;
        levelAreaContainer.addChild(lvText);

        // 強化ボタン(強化に必要な素材の数が揃っている場合のみ点灯)        
        let forceButtonContainer = new PIXI.Container();        

        forceButtonContainer.scale.x = forceButtonContainer.scale.y = 1.75;
        forceButtonContainer.x = 350;
        forceButtonContainer.y = 15;
        let forceButtonSpine = new PIXI.spine.Spine(spineRawData["uiParts"]);

        // 神水必要数
        let reqGod = jsonContainer['tables']["heroLevel"]["lv"][this.heroInfo['lv']][0];
        // 秘薬必要数
        let reqElix = jsonContainer['tables']["heroLevel"]["lv"][this.heroInfo['lv']][1];

        // 所持しているかどうか
        let enough = false;
        let godID = jsonContainer['tables']["heroLevel"]["required"][0];
        let elixID = jsonContainer['tables']["heroLevel"]["required"][1];
        if(jsonContainer['userData']["item"][godID] && jsonContainer['userData']["item"][elixID]){
            if(jsonContainer['userData']["item"][godID] >= reqGod && jsonContainer['userData']["item"][elixID] >= reqElix) enough = true;
        }
        if(enough) forceButtonSpine.state.addAnimation(0, 'upBtn_active', true, 0);
        else forceButtonSpine.state.addAnimation(0, 'upBtn_idle', true, 0);



        forceButtonSpine.interactive = true;
        forceButtonSpine.name = "hero-"+ this.id;
        forceButtonSpine.on("click", this.forceWindowOpen)
        .on("touchstart", this.forceWindowOpen);
        forceButtonContainer.addChild(forceButtonSpine);
        levelAreaContainer.addChild(forceButtonContainer);

        this.sceneContainer.addChild(levelAreaContainer);


        // 強化ウィンドウ
        this.forceWindow = new PIXI.Container();
        this.forceWindowSpine = new PIXI.spine.Spine(spineRawData["modal"]);
        this.forceWindowSpine.state.addAnimation(0, 'expUpWindow_active', true, 0);
        this.forceWindowSpine.interactive = true;
        this.forceWindow.addChild(this.forceWindowSpine);

        this.forceWindowTitle = new PIXI.Text(jsonContainer["language"]["heroCustom"]["force"]["modalTitle"][lang], {fontFamily : 'Arial', fontSize:42, fill : 0xffffff, align : "center", wordWrapWidth: 400});
        this.forceWindowTitle.anchor.x = 0.5;
        this.forceWindowTitle.x = 1245;
        this.forceWindowTitle.y = 245;
        this.forceWindow.addChild(this.forceWindowTitle);

        let reqIndex = new PIXI.Text(jsonContainer["language"]["heroCustom"]["force"]["required"][lang], {fontFamily : 'Arial', fontSize:30, fill : 0xffffff, align : "center", wordWrapWidth: 400});
        reqIndex.anchor.x = 0.5;
        reqIndex.x = 1260;
        reqIndex.y = 555;
        this.forceWindow.addChild(reqIndex);

        // EXPフレーム
        let force_expFrame = new PIXI.Sprite(); 
        force_expFrame.x = 1270;
        force_expFrame.y = 425;
        force_expFrame.scale.x = force_expFrame.scale.y = 1.5;
        force_expFrame.texture = new PIXI.Texture(textureContainer["frames"], new PIXI.Rectangle(expFrameRect[0], expFrameRect[1], expFrameRect[2], expFrameRect[3]));
        this.forceWindow.addChild(force_expFrame);

        // レベル
        this.forceWindowLevel = new PIXI.Text(jsonContainer["language"]["heroCustom"]["force"]["lv"][lang] +" : "+ this.heroInfo['lv'], {fontFamily : 'Arial', fontSize:36, fill : 0xfff9c3, align : "left", wordWrapWidth: 400});
        this.forceWindowLevel.anchor.x = 0.5;
        this.forceWindowLevel.x = 1270 + force_expFrame.width/2;
        this.forceWindowLevel.y = 375;
        this.forceWindow.addChild(this.forceWindowLevel);
        
        // 対象アイコンコンテナ
        this.forceTargetContainer = new PIXI.Container();
        this.forceTargetContainer.x = 960;
        this.forceTargetContainer.y = 350;
        this.forceWindow.addChild(this.forceTargetContainer);

        // 必要アイテムコンテナ
        this.forceRequiredContainer = new PIXI.Container();
        this.forceRequiredContainer.x = 920;
        this.forceRequiredContainer.y = 645;
        this.forceWindow.addChild(this.forceRequiredContainer);

        //クリックエリア
        for(let areaInfo of jsonContainer["clickArea"]["forceWindow"]){
            let clickArea = new PIXI.Graphics();
            clickArea.lineStyle(0, 0x000000, 0);
            clickArea.beginFill(0xff0000, 0.0000001);
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
            this.forceWindow.addChild(clickArea);
        }

        

        //スキルスロット
        for(let i = 0; i < 2; i++){
            let slotContainer = new PIXI.Container();

            //フレーム
            let frame = new PIXI.Sprite(); 
            frame.texture = new PIXI.Texture(textureContainer["frames"], new PIXI.Rectangle(0, 260, 130, 130));

            //下地プレート
            let plate = new PIXI.Sprite();            

            //スキルアイコン
            let skillThumContainer = new PIXI.Container();
            let thum = new PIXI.Sprite();

            // 当該スロットにスキルが装填されていたらサムネ表示
            if(this.heroInfo["skillSet"][i]){
                //スキルID
                let skillID = this.heroInfo["skillSet"][i];

                //スキルアイコン                
                thum.texture = this.skillTextureList[skillID];
                thum.x = 5;
                thum.y = 5;
                thum.name = this.id +"-"+ skillID;                

                plate.texture = new PIXI.Texture(textureContainer["frames"], new PIXI.Rectangle(130, 433, 130, 130));
                thum.mask = plate;
            }
            else plate.texture = new PIXI.Texture(textureContainer["frames"], new PIXI.Rectangle(0, 433, 130, 130));
            
            skillThumContainer.addChild(thum);
            this.skillSlotSpriteList.push(thum);
            this.skillSlotSpritePlateList.push(plate);
    
            slotContainer.x = 1550 + i * 250;
            slotContainer.y = 740;
            slotContainer.scale.x = slotContainer.scale.y = 1.5;
    
            slotContainer.addChild(plate);
            slotContainer.addChild(skillThumContainer);
            slotContainer.addChild(frame);

            this.sceneContainer.addChild(slotContainer);
        }

        // ページ構築
        this.pageBuild(this.viewPage);
        

        
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

    // 強化ウィンドウ表示
    forceWindowOpen(e){
        let _type = e.target.name.split("-")[0];
        let _id = e.target.name.split("-")[1];

        if(_type == "hero"){
            heroCustomContent.forceWindowTitle.text = jsonContainer["language"]["heroCustom"]["force"]["lvup"][lang];

            let myHeroIndex = jsonContainer['userData']["hero"].findIndex((v) => v.id === _id);

            let myHeroLv = jsonContainer['userData']["hero"][myHeroIndex]['lv'];

            // キャラクターアイコン
            let heroIcon = buildHeroIcon(jsonContainer['userData']["hero"][myHeroIndex]);
            heroCustomContent.forceTargetContainer.addChild(heroIcon);

            // 神水必要数
            let reqGod = jsonContainer['tables']["heroLevel"]["lv"][myHeroLv][0];
            // 秘薬必要数
            let reqElix = jsonContainer['tables']["heroLevel"]["lv"][myHeroLv][1];

            //必要アイテムID            
            let godID = jsonContainer['tables']["heroLevel"]["required"][0];
            let elixID = jsonContainer['tables']["heroLevel"]["required"][1];

            //必要アイテムアイコン
            let godThumInfo = jsonContainer['itemData'][godID]["thum"];
            let godIcon = buildIcon(textureContainer[godThumInfo["texture"]], godThumInfo["rect"], reqGod);

            let bagIcon1 = new PIXI.Sprite();
            let bagRect = jsonContainer['framesAtlas']["bag"];
            bagIcon1.texture = new PIXI.Texture(textureContainer["frames"], new PIXI.Rectangle(bagRect[0], bagRect[1], bagRect[2], bagRect[3]));
            bagIcon1.x = godIcon.x;
            bagIcon1.y = godIcon.y + 155;
            bagIcon1.scale.x = bagIcon1.scale.y = 0.7;

            let elixThumInfo = jsonContainer['itemData'][elixID]["thum"];
            let elixIcon = buildIcon(textureContainer[elixThumInfo["texture"]], elixThumInfo["rect"], reqElix);
            elixIcon.x = 160;

            let bagIcon2 = new PIXI.Sprite();
            bagIcon2.texture = new PIXI.Texture(textureContainer["frames"], new PIXI.Rectangle(bagRect[0], bagRect[1], bagRect[2], bagRect[3]));
            bagIcon2.x = elixIcon.x;
            bagIcon2.y = elixIcon.y + 155;
            bagIcon2.scale.x = bagIcon2.scale.y = 0.7;

            //所持数
            let hasGod = 0;
            if(jsonContainer['userData']["item"][godID]) hasGod = jsonContainer['userData']["item"][godID];

            let hasElix = 0;
            if(jsonContainer['userData']["item"][elixID]) hasElix = jsonContainer['userData']["item"][elixID];

            let hasGodText = new PIXI.Text(hasGod, {fontFamily : 'Arial', fontSize:26, fill : 0xffffff, align : "left", wordWrapWidth: 400});
            hasGodText.x = godIcon.x + 50;
            hasGodText.y = godIcon.y + 160;            

            let hasElixText = new PIXI.Text(hasElix, {fontFamily : 'Arial', fontSize:26, fill : 0xffffff, align : "left", wordWrapWidth: 400});
            hasElixText.x = elixIcon.x + 50;
            hasElixText.y = elixIcon.y + 160;            

            heroCustomContent.forceRequiredIconContainer = new PIXI.Container();
            heroCustomContent.forceRequiredIconContainer.addChild(godIcon);
            heroCustomContent.forceRequiredIconContainer.addChild(elixIcon);
            heroCustomContent.forceRequiredIconContainer.addChild(bagIcon1);
            heroCustomContent.forceRequiredIconContainer.addChild(bagIcon2);

            heroCustomContent.forceRequiredIconContainer.addChild(hasGodText);
            heroCustomContent.forceRequiredIconContainer.addChild(hasElixText);
            
            heroCustomContent.forceRequiredContainer.addChild(heroCustomContent.forceRequiredIconContainer);

        }        

        heroCustomContent.sceneContainer.addChild(heroCustomContent.forceWindow);
    }

    //ページ構築
    pageBuild(_target){
        // タブボタンをいったんすべてリセット
        for(let t in this.pageContainerList){
            let _nowSlot = this.stageSpine.skeleton.findSlot(t +"Tab");
            _nowSlot.data.attachmentName = "tab_off";
            _nowSlot.setToSetupPose();
        }
        

        this.sceneContainer.removeChild(this.pageContainerList[this.viewPage]);

        this.viewPage = _target;

        let _newSlot = this.stageSpine.skeleton.findSlot(this.viewPage +"Tab");
        _newSlot.data.attachmentName = "tab_on";
        _newSlot.setToSetupPose();

        switch(_target){
            case "status":

                // ステータス表示
                for(let i = 0; i < this.viewStatus.length; i++){
                    let _stat = this.viewStatus[i];
                    let statusName = jsonContainer["language"]["status"][_stat][lang];
                    let statusValue = this.myHeroStatus[_stat];

                    let text = new PIXI.Text(statusName +" : "+ statusValue, {fontFamily : 'Arial', fontSize:30, fill : 0xfff9c3, align : "left", wordWrapWidth: 400});
                    text.y = i * 50;

                    this.statusContainer.addChild(text);
                }
                this.statusContainer.x = 790;
                this.statusContainer.y = 135;
                this.sceneContainer.addChild(this.statusContainer);

                break;
            case "skill":

                this.skillBoxList = [];

                // 習得済みスキル一覧
                for(let i = 0; i < this.heroInfo["skillAquired"].length; i++){
                    
                    let _skillBox = new skillBox(this.heroInfo["skillAquired"][i]['id'], this);
                    this.skillBoxList.push(_skillBox);

                    //スキルボックスの位置を調整してコンテナ配置
                    _skillBox.container.x = 0;
                    _skillBox.container.y = 5 + 200 * i;

                    this.skillContainer.addChild(_skillBox.container);                    
                }

                this.skillContainer.x = 750;
                this.skillContainer.y = 135;
                this.sceneContainer.addChild(this.skillContainer);

                break;
        }
    }

    // ページ移動確認
    checkPageMove(_target){
        if(this.viewPage != _target) this.pageBuild(_target);
    }
    
    onClick(e){
        if(e.currentTarget.name == "backButton"){
            //コンテンツシーン移動
            contentTransfer("heroList", heroCustomContent);
        }
        else if(e.currentTarget.name == "skill"){
            //コンテンツページ移動
            heroCustomContent.checkPageMove(e.currentTarget.name);
        }
        else if(e.currentTarget.name == "status"){
            //コンテンツページ移動
            heroCustomContent.checkPageMove(e.currentTarget.name);
        }
        else if(e.currentTarget.name == "modalClose"){
            heroCustomContent.sceneContainer.removeChild(heroCustomContent.forceWindow);
        }
        else if(e.currentTarget.name == "forceExucute"){
            
        }
    }

    //文字情報配置
    languageUpdate(){
        for(let _part in jsonContainer["language"]["heroCustom"]){           

            let textInfo = jsonContainer["language"]["heroCustom"][_part];

            if(!textInfo.pos) continue;

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
        for(let areaInfo of jsonContainer["clickArea"]["heroCustom"]){
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

    //スキル装填ボタン処理
    skillSetSwitch(_targetSkillID){
        let targetSkillBox = this.skillBoxList.find((v) => v.skillID === _targetSkillID);

        if(targetSkillBox.state == "on"){
            targetSkillBox.state = "off";
            //ユーザーキャラクター情報を更新
            let setIndex = this.heroInfo.skillSet.indexOf(_targetSkillID);
            this.heroInfo.skillSet.splice(setIndex, 1);
        }
        else{
            targetSkillBox.state = "on";
            //ユーザーキャラクター情報を更新
            this.heroInfo.skillSet.push(_targetSkillID);
        }

        //アカウントデータ更新
        saveAcountJSON();

        //スロットおよびボックスの状態を更新
        this.skillSlotBoxUpdate();

        // let imgRect = jsonContainer["framesAtlas"]["skillSetButton"][this.state];
        // this.btnImage.texture = new PIXI.Texture(textureContainer["frames"], new PIXI.Rectangle(imgRect[0], imgRect[1], imgRect[2], imgRect[3]));

        // this.btnText.text = jsonContainer["language"]["heroCustom"]["skillSetButton"][this.state][lang];
    }
    skillSlotBoxUpdate(){
        //スキルスロット
        for(let i = 0; i < 2; i++){
            // 当該スロットにスキルが装填されていたらサムネ表示
            if(this.heroInfo["skillSet"][i]){
                //スキルID
                let skillID = this.heroInfo["skillSet"][i];

                //スキルアイコン                
                this.skillSlotSpriteList[i].texture = this.skillTextureList[skillID];        

                this.skillSlotSpritePlateList[i].texture = new PIXI.Texture(textureContainer["frames"], new PIXI.Rectangle(130, 433, 130, 130));
                this.skillSlotSpriteList[i].mask = this.skillSlotSpritePlateList[i];
            }
            else{
                this.skillSlotSpriteList[i].texture = null;
                this.skillSlotSpriteList[i].mask = null;
                this.skillSlotSpritePlateList[i].texture = new PIXI.Texture(textureContainer["frames"], new PIXI.Rectangle(0, 433, 130, 130));
            }
        }

        //スキルボックス
        for(let i = 0; i < this.skillBoxList.length; i++){
            //ボックスクラスで処理呼び出し
            this.skillBoxList[i].btnUpdate();
        }
    }
    
}

//スキルボックスclass
class skillBox{
    constructor(skillID, stageObj){
        this.stageObj = stageObj;
        this.skillID = skillID;

        // スキルコンテナ
        this.container = new PIXI.Container();

        //スキルアイコン
        this.skillIcon;

        // 装着ボタン
        this._setBtn;
        this.state;
        this.btnImage;
        this.btnText;

        this.build();
    }

    build(){
        //スキル情報
        let skillInfo = jsonContainer["heroData"][this.stageObj.heroInfo.id]["skill"].find((v) => v.id === this.skillID);

        //サムネイル矩形
        let _rect = skillInfo["thum"]["rect"];

        this.skillIcon = buildIcon(textureContainer[skillInfo["thum"]["img"]], _rect, 1);
        this.skillIcon.scale.x = this.skillIcon.scale.y = 1.25;
        this.skillIcon.name = this.id +"-"+ this.skillID;
        this.container.addChild(this.skillIcon);

        //スキル名
        let nametext = new PIXI.Text(skillInfo['name'][lang], {fontFamily : 'Arial', fontSize:30, fill : 0xfff9c3, align : "left", wordWrapWidth: 400});
        nametext.x = 200;
        nametext.y = 10;
        this.container.addChild(nametext);

        // 装填・解除ボタン
        //コンテナ
        this._setBtn = new PIXI.Container();

        //当該スキルが装填されているかどうか
        if(this.stageObj.heroInfo.skillSet.indexOf(this.skillID) > -1) this.state = "on";
        else this.state = "off";

        //ボタンテクスチャ        
        this.btnImage = new PIXI.Sprite();
        let imgRect = jsonContainer["framesAtlas"]["skillSetButton"][this.state];
        this.btnImage.texture = new PIXI.Texture(textureContainer["frames"], new PIXI.Rectangle(imgRect[0], imgRect[1], imgRect[2], imgRect[3]));

        this.btnImage.scale.x = this.btnImage.scale.y = 1.25;

        this.btnText = new PIXI.Text(jsonContainer["language"]["heroCustom"]["skillSetButton"][this.state][lang], {fontFamily : 'Arial', fontSize:30, fill : 0xfff9c3, align : "left", wordWrapWidth: 400});
        this.btnText.anchor.x = 0.5;
        this.btnText.x = this.btnImage.width / 2;
        this.btnText.y = 10;

        this._setBtn.addChild(this.btnImage);
        this._setBtn.addChild(this.btnText);

        this._setBtn.x = 205;
        this._setBtn.y = 110;

        this._setBtn.interactive = true;

        if(this.stageObj.heroInfo.skillSet.length == 2 && this.state == "off"){
            //ボタンの明度調整
            let colorMatrix =  [
                1,0,0,-0.2,0,
                0,1,0,-0.2,0,
                0,0,1,-0.2,0,
                0,0,0,1,0,
                0,0,0,0,1
            ];
            var filter = new PIXI.filters.ColorMatrixFilter();
            filter.matrix = colorMatrix;
            this._setBtn.filters = [filter];

            this.btnText.text = "-";
            this._setBtn.interactive = false;
        }
        else{
            this._setBtn.filters = [];
        }     

        this._setBtn.name = this.stageObj.heroInfo.id +"-"+ this.skillID;
        this._setBtn.obj = this;

        this._setBtn.on("click", this.onClick)
                    .on("touchstart", this.onClick);

        this.container.addChild(this._setBtn);
    }

    // 装填ボタンを押したときにシーンクラスから呼び出される更新処理
    btnUpdate(){
        //ボタン画像切り替え
        let imgRect = jsonContainer["framesAtlas"]["skillSetButton"][this.state];
        this.btnImage.texture = new PIXI.Texture(textureContainer["frames"], new PIXI.Rectangle(imgRect[0], imgRect[1], imgRect[2], imgRect[3]));

        //表示テキスト更新
        this.btnText.text = jsonContainer["language"]["heroCustom"]["skillSetButton"][this.state][lang];

        if(this.stageObj.heroInfo.skillSet.length == 2 && this.state == "off"){
            //ボタンの明度調整
            let colorMatrix =  [
                1,0,0,-0.2,0,
                0,1,0,-0.2,0,
                0,0,1,-0.2,0,
                0,0,0,1,0,
                0,0,0,0,1
            ];
            var filter = new PIXI.filters.ColorMatrixFilter();
            filter.matrix = colorMatrix;
            this._setBtn.filters = [filter];

            this.btnText.text = "-";
            this._setBtn.interactive = false;
        }
        else{
            this._setBtn.interactive = true;
            this._setBtn.filters = [];
        }
    }

    onClick(e){
        e.currentTarget.obj.clickHandler();
    }
    clickHandler(){
        this.stageObj.skillSetSwitch(this.skillID);        
    }
}
