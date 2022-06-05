functionObject["battleField"] = () => {
    battleContent = new Battle();
    updateTarget.push(battleContent);
    renderTarget.push(battleContent);    
};

class Battle {
    constructor(){
        // 再生フラグ
        this.onPlaying = true;

        //シーン全体のコンテナ
        this.sceneContainer;

        //背景以外の動作オブジェクト配置コンテナ
        this.stageContainer;

        // 再生Spineオブジェクト
        this.playSpineList = [];

        //マニュアルorオート
        this.battlePlay;

        this.loaded = false;
        this.battleStarted = false;
        this.frame = 0;

        //戦闘終了フラグ
        this.battleEnd = false;
        this.battleEndTime = -1;

        this.battle_bg;
        this.battle_front;

        //自陣チーム情報
        this.ownTeamData = [];
        this.ownActiveList = [];

        //敵陣チーム情報
        this.enemyTeamInfo = [
            {
                "type":"hero",
                "id":"001_wolf",
                "pos":[0,1],
                "lv":5,
                "skillSet":["001_wolf_1"]
            },
            {
                "type":"enemy",
                "id":"e001_archer",
                "pos":[1,1],
                "lv":1,
                "skillSet":[]
            }
        ];
        this.enemyTeamData = [];
        this.enemyActiveList = [];

        //必要リソースキャラクターID
        this.needleHeroID = [];

        //数字テクスチャ
        this.textureList = {};

        //数値オブジェクトコンテナリスト
        this.numContainerList = [];

        //バトル画面クリックエリアオブジェクト配列
        this.clickAreaList = [];

        this.resultContainer;

        // 勝敗結果
        this.resultFlag;

        this.load();
    }

    load() {
        //数字テクスチャを生成(8種類0～10)
        let numType = ["critical", "physical", "special", "magical", "healCritical", "heal", "buff", "pure"];
        for(let j = 0; j < 8; j++){
            for(let i = 0; i < 10; i++){
                let texture = textureContainer["battle_ui"].clone();
                if(!this.textureList[ numType[j] ]) this.textureList[ numType[j] ] = [];  
                this.textureList[ numType[j] ].push(new PIXI.Texture(texture, new PIXI.Rectangle(30 * (i + 1), j * 40, 30, 40)));
            }
        }

        //操作方式
        this.battlePlay = jsonContainer["userData"]["battlePlay"];

        //シーンコンテナを生成
        this.sceneContainer = new PIXI.Container();
        this.stageContainer = new PIXI.Container();

        //自陣チーム情報を形成
        let _team = jsonContainer["userData"]["teams"][ jsonContainer["userData"]["activeTeam"] ]['team'];

        //各メンバー情報
        for(let i = 0; i < _team.length; i++){

            //キャラクターID
            let _id = _team[i];

            //必要キャラクターIDに登録
            if(this.needleHeroID.indexOf(_id) === -1 && !(_id in ownHeroSpineContainer)) this.needleHeroID.push(_id);

            // ヒーロー個別情報を取得
            let _heroInfo = jsonContainer["userData"]['hero'].find((v) => v.id === _id);

            //キャラクターオブジェクトの生成
            let _hero = new Hero("own", _id, i, _heroInfo);

            this.ownTeamData.push(_hero);
            this.ownActiveList.push(_id);
        }

        //敵陣チーム情報を形成
        for(let i = 0; i < this.enemyTeamInfo.length; i++){

            //キャラクターID
            let _id = this.enemyTeamInfo[i]['id'];

            //必要キャラクターIDに登録
            if(this.needleHeroID.indexOf(_id) === -1 && !(_id in enemyHeroSpineContainer)) this.needleHeroID.push(_id);

            // ヒーロー個別情報を取得
            let _heroInfo = this.enemyTeamInfo[i];

            //キャラクターオブジェクトの生成
            let _hero = new Hero("enemy", _id, i, _heroInfo);

            this.enemyTeamData.push(_hero);
            this.enemyActiveList.push(_id);
        }

        //背景画像の読み込み
        let timeCode = Date.now();
        let _loader = PIXI.Loader.shared;
        PIXI.utils.clearTextureCache();
        _loader.reset();
        _loader.add('battle_bg', './img/004_battle/stage01/004_battle.json?'+ timeCode);

        //自陣必要キャラクター読み込み
        for(let _id of this.needleHeroID){
            _loader.add(_id +"_own", './img/999_chara/'+ _id +'/'+ _id +'.json?'+ timeCode);
            _loader.add(_id +"_fx_own", './img/999_chara/'+ _id +'_fx/'+ _id +'_fx.json?'+ timeCode);
        }
        _loader.load(this.onAssetsOwnLoaded);
    }

    //最背景および自陣キャラクター読み込み完了
    onAssetsOwnLoaded(loader, res) {
        // 最背景SPINE
        battleContent.battle_bg = new PIXI.spine.Spine(res.battle_bg.spineData);    
        // set the position
        battleContent.battle_bg.x = 0;
        battleContent.battle_bg.y = 0;    
        battleContent.battle_bg.scale.set(1);
        battleContent.battle_bg.state.setAnimation(0, 'idle', true);
        battleContent.playSpineList.push(battleContent.battle_bg);
        battleContent.sceneContainer.addChild(battleContent.battle_bg);

        battleContent.battle_bg.zIndex = 0;
        
        //自陣キャラクター配置
        for(let i = 0; i < battleContent.ownTeamData.length; i++){
            let _chr =  battleContent.ownTeamData[i];

            let spine;
            let spine_fx;

            // Spine読み込みデータがある場合
            if(res[ _chr['id']+"_own" ]){
                spine = new PIXI.spine.Spine(res[ _chr['id']+"_own" ].spineData);
                // 読み込み済キャラSpine配列に格納
                ownHeroSpineContainer[_chr['id']] = spine;

                spine_fx = new PIXI.spine.Spine(res[ _chr['id']+"_fx_own" ].spineData);
                // 読み込み済キャラSpine配列に格納
                ownHeroSpineContainer[_chr['id'] +"_fx_own"] = spine_fx;
            }
            else{
                spine = ownHeroSpineContainer[_chr['id']];
                spine_fx = ownHeroSpineContainer[_chr['id'] +"_fx_own"];
            }

            //キャラクタークラスのステージ配置関数
            _chr.addStage(spine, "run", _chr['pos'], spine_fx);
        }


        //敵陣必要キャラクター読み込み
        let timeCode = Date.now();
        let _loader = PIXI.Loader.shared;
        PIXI.utils.clearTextureCache();
        
        for(let _id of battleContent.needleHeroID){
            _loader.add(_id +"_enemy", './img/999_chara/'+ _id +'/'+ _id +'.json?'+ timeCode);
            _loader.add(_id +"_fx_enemy", './img/999_chara/'+ _id +'_fx/'+ _id +'_fx.json?'+ timeCode);
        }
        _loader.load(battleContent.onAssetsEnemyLoaded);

    }

    //敵陣キャラクターおよび前面背景読み込み完了
    onAssetsEnemyLoaded(loader, res) {

        //敵陣キャラクター配置
        for(let i = 0; i < battleContent.enemyTeamData.length; i++){
            let _chr =  battleContent.enemyTeamData[i];

            let spine;
            let spine_fx;

            // Spine読み込みデータがある場合
            if(res[ _chr['id']+"_enemy" ]){
                spine = new PIXI.spine.Spine(res[ _chr['id']+"_enemy" ].spineData);
                // 読み込み済キャラSpine配列に格納
                enemyHeroSpineContainer[_chr['id']] = spine;

                spine_fx = new PIXI.spine.Spine(res[ _chr['id']+"_fx_enemy" ].spineData);
                // 読み込み済キャラSpine配列に格納
                enemyHeroSpineContainer[_chr['id'] +"_fx_enemy"] = spine_fx;
            }
            else{
                spine = enemyHeroSpineContainer[_chr['id']];
                spine_fx = enemyHeroSpineContainer[_chr['id'] +"_fx_enemy"];
            }

            //キャラクタークラスのステージ配置関数
            _chr.addStage(spine, "run", _chr['pos'], spine_fx);
        }

        // ステージコンテナをシーンコンテナに配置
        battleContent.sceneContainer.addChild(battleContent.stageContainer);
        // zIndexによる重なり順制御
        battleContent.stageContainer.sortableChildren = true;
        

        // 前面背景SPINE
        battleContent.battle_front = new PIXI.spine.Spine(res.battle_bg.spineData);
        // set the position
        battleContent.battle_front.state.setAnimation(0, 'idle_front', true);
        battleContent.playSpineList.push(battleContent.battle_front);  
        battleContent.stageContainer.addChild(battleContent.battle_front);

        battleContent.battle_front.zIndex = 800000000;
        battleContent.stageContainer.sortChildren();


        // 操作モードに合わせてボタン切り替え
        let _slot = battleContent.battle_front.skeleton.findSlot("buttonBase_"+ battleContent.battlePlay);
        _slot.data.attachmentName = "activeButton";
        _slot.setToSetupPose();

        //クリックエリア構築
        battleContent.buildClickArea();

        //シーンコンテナをステージに配置
        app.stage.addChild(battleContent.sceneContainer);

        // 検証情報を表示
        app.stage.removeChild(fpsText);
        app.stage.addChild(fpsText);
        

        //読み込み完了フラグ
        battleContent.loaded = true;
    }
    

    //毎フレーム処理
    update(){
        if(this.loaded && this.onPlaying){

            //戦闘終了処理
            if(this.battleEnd == true){
                if(this.battleEndTime < 0) this.battleEndTime = this.frame;
                if(this.battleEndTime + 210 <= this.frame){
                    this.loaded = false;

                    //リザルト画面表示
                    this.resultBuild();
                }
            }

            //すべてのキャラクターに対して処理
            for(let _i = 0; _i < 5; _i++){
                if(this.ownTeamData[_i]) this.ownTeamData[_i].update();
                if(this.enemyTeamData[_i]) this.enemyTeamData[_i].update();
            }          

            //数字コンテナ処理
            for(let c = this.numContainerList.length - 1; c >= 0; c--){
                let c_info = this.numContainerList[c];
                if(c_info.birth + 60 <= this.frame){
                    c_info.container.removeChild(c_info.obj);
                    c_info.obj = null;
                    this.numContainerList.splice(c, 1);
                }
                else{
                    //if(c_info.obj.alpha < 1) c_info.obj.alpha += 0.2;
                    c_info.obj.x += c_info.dir;
                }
            }

            //全体フレームカウント
            if(this.battleStarted) this.frame++;        
        }        
    }

    render(){
      
    }

    //リザルト画面構築
    resultBuild(){
        this.resultContainer = new PIXI.Container();
        this.resultContainer.addChild(spineContainer["ui"]);
        spineContainer["ui"].state.setAnimation(0, 'result', true);

        let _nowSlot = spineContainer["ui"].skeleton.findSlot("skillTab");
        _nowSlot.data.attachmentName = "tab_off";
        _nowSlot.setToSetupPose();

        this.sceneContainer.addChild(this.resultContainer);

        //バトル画面のクリックエリアのリスナー除去
        for(let _area of this.clickAreaList){
            _area.interactive = false;
        }

        // 操作モードを記録
        jsonContainer["userData"]["battlePlay"] = this.battlePlay;

        //クリック範囲を描画
        for(let areaInfo of jsonContainer["clickArea"]["result"]){
            let clickArea = new PIXI.Graphics();
            clickArea.lineStyle(0, 0x000000, 0);
            clickArea.beginFill(0xff0000, 0.001);
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
            this.resultContainer.addChild(clickArea);
        }
        
        //画面内デフォルト配置テキスト
        for(let _part in jsonContainer["language"]["result"]){

            let textInfo = {};
            if(!jsonContainer["language"]["result"][_part]['pos']){
                textInfo = jsonContainer["language"]["result"][_part][this.resultFlag];
            }
            else{
                textInfo = jsonContainer["language"]["result"][_part];
            }

            let _fontSize = 42;
            if(textInfo["size"]) _fontSize = textInfo["size"];
            let _align = "center";
            if(textInfo["align"]) _align = textInfo["align"];

            let text = new PIXI.Text(textInfo[lang], {fontFamily : 'Arial', fontSize:_fontSize, fill : 0xfff9c3, align : _align, wordWrapWidth: 400});
            text.y = textInfo.pos[1];

            text.anchor.x = 0.5;
            text.x = textInfo.pos[0];

            this.resultContainer.addChild(text);            
        }

        //チーム全体のキャラ成績をいったん評価
        let scoreList = ["damageDealt","damageTaken","healDealt"];
        let SumList = [0, 0, 0];
        let TopList = [0, 0, 0];
        for(let i = 0; i < this.ownTeamData.length; i++){
            let member = this.ownTeamData[i];

            for(let j = 0; j < 3; j++){
                SumList[j] += member[scoreList[j]];
                if(TopList[j] < member[scoreList[j]]) TopList[j] = member[scoreList[j]];
            }
        }

        //与ダメージの大きい順にソート
        this.ownTeamData.sort(function(a, b) {
            if (a["damageDealt"] < b["damageDealt"]) {
                return 1;                                
              } else {
                return -1;
              }
        });
        
        //キャラクター成績
        for(let i = 0; i < this.ownTeamData.length; i++){
            let member = this.ownTeamData[i];
            member['thum'].x = 820 + member['thum'].width;
            member['thum'].y = 265 + i * 150;
            member['thum'].scale.x = -1;
            this.resultContainer.addChild(member['thum']);

            let topPosition = 260;
            let columnHeight = 150;
            let verticalAdjust = 40;

            //フレームテクスチャ            
            let frame = new PIXI.Sprite(); 
            frame.texture = new PIXI.Texture(textureContainer["frames"], new PIXI.Rectangle(0, 0, 130, 130));
            frame.x = 815;
            frame.y = topPosition + i * columnHeight;
            this.resultContainer.addChild(frame);

            //キャラクター名
            let text = new PIXI.Text(jsonContainer["heroData"][member['id']]["name"][lang], {fontFamily : 'Arial', fontSize: 42, fill : 0xfff9c3, align : 'left', wordWrapWidth: 400});
            text.x = 1000;
            text.y = topPosition + i * columnHeight + verticalAdjust;
            this.resultContainer.addChild(text);

            // 成績フレーム            
            let guageWidth = 250;
            let leftPosition = 1260;            
            let guageMargin = 35;
            //スコアバーカラー
            let colorList = [0x228308, 0xa10202, 0x0017c0];
            for(let j = 0; j < 3; j++){
                //スコアバーのフレーム
                let guageFrame = new PIXI.Graphics();
                guageFrame.lineStyle(4, 0xcbcbc7, 1);
                guageFrame.beginFill(0x000000, 0.5);

                guageFrame.drawRoundedRect(0, 0,  guageWidth, 50, 8);
                guageFrame.endFill();
    
                // 位置（四角の左上が基準として）
                guageFrame.x = leftPosition + (guageWidth + guageMargin) * j;
                guageFrame.y = topPosition + i * columnHeight + verticalAdjust;
                this.resultContainer.addChild(guageFrame);

                //スコアバー
                if(member[scoreList[j]] > 0){
                    //スコアに応じたスコアバーの長さ
                    let barWidth = guageWidth * (member[scoreList[j]] / TopList[j]);
                    //バーオブジェクト
                    let guageBar = new PIXI.Graphics();

                    //バーのトゥイーン描画(Graphicオブジェクト, 所要フレーム, 開始の長さ, 終了の長さ, 角丸, 色, 透明度, 線の太さ, 線の色, 線の透明度)
                    tween.addDrawBar(guageBar, 120, 0, barWidth - 10, 50 - 10, 8, colorList[j], 1, 1, 0xcbcbc7, 0);
        
                    // 位置（四角の左上が基準として）
                    guageBar.x = leftPosition + (guageWidth + guageMargin) * j + 5;
                    guageBar.y = topPosition + i * columnHeight + verticalAdjust + 5;
                    this.resultContainer.addChild(guageBar);
                }                

                //スコア数値表記
                let text = new PIXI.Text(member[scoreList[j]], {fontFamily : 'Arial', fontSize: 36, fill : 0xffffff, align : 'center', wordWrapWidth:  guageWidth});
                text.y = topPosition + 5 + i * columnHeight + verticalAdjust;

                text.anchor.x = 0.5;
                text.x = leftPosition + (guageWidth + guageMargin) * j + (guageWidth / 2);

                this.resultContainer.addChild(text);
            }
            
        }

        // 検証情報を表示
        app.stage.removeChild(fpsText);
        app.stage.addChild(fpsText);

        //アカウントデータ更新
        saveAcountJSON();
    }
    
    onClick(e){
        if(e.currentTarget.name == "ownTeamButton"){
            console.log("自陣チーム戦績");
        }
        else if(e.currentTarget.name == "opponentTeamButton"){
            console.log("敵陣チーム戦績");
        }
        else if(e.currentTarget.name == "backButton"){
            //コンテンツシーン移動
            contentTransfer("jungleYard", battleContent);
        }
        else if(e.currentTarget.name == "auto" || e.currentTarget.name == "manual" || e.currentTarget.name == "standby"){
            //操作モードの切り替え
            let _slot = battleContent.battle_front.skeleton.findSlot("buttonBase_"+ battleContent.battlePlay);
            _slot.data.attachmentName = "deactiveButton";
            _slot.setToSetupPose();

            battleContent.battlePlay = e.currentTarget.name;

            _slot = battleContent.battle_front.skeleton.findSlot("buttonBase_"+ battleContent.battlePlay);
            _slot.data.attachmentName = "activeButton";
            _slot.setToSetupPose();

        }
        else if(e.currentTarget.name == "play"){

            if(battleContent.onPlaying) battleContent.timeLinePause();
            else battleContent.timeLineRestart();

            // PlayボタンUIスロットインデックス
            let _slot = battleContent.battle_front.skeleton.findSlot("playButtonFace");            

            if(battleContent.onPlaying) _slot.data.attachmentName = "pause";
            else _slot.data.attachmentName = "play";

            _slot.setToSetupPose();
        }
    }

    timeLinePause(){
        this.onPlaying = false;

        // 再生Spineすべての再生切り替え
        for(let _spine of battleContent.playSpineList){
            _spine.state.timeScale = 0;
        }
    }

    timeLineRestart(){
        this.onPlaying = true;

        // 再生Spineすべての再生切り替え
        for(let _spine of battleContent.playSpineList){
            _spine.state.timeScale = 1;
        }
    }

    //クリックエリア構築
    buildClickArea(){
        //クリック範囲を描画
        for(let areaInfo of jsonContainer["clickArea"]["battle"]){
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

            this.clickAreaList.push(clickArea);
        }
    }
}

//キャラクタークラス
class Hero {
    constructor(_camp, _id, _index, _infoData){
        //キャラクターID
        this.id = _id;

        //陣営
        this.camp = _camp;
        //敵陣
        this.opposite;
        //移動・攻撃方向
        this.dir;

        //戦場配置
        this.pos;

        this.container;
        this.FXcontainer;
        this.spine;
        this.spineFX;
        this.anim;
        this.animEndFrame = -1;

        //ゲージコンテナ
        this.guageContainer;
        //HPバー
        this.hpBar;
        //スキルチャージバー
        this.chargeBar;

        //フィルター処理時間
        this.filterClearTime = -1;

        //経過フレーム
        this.frame = -1;

        //戦闘モード
        this.battleMode = false;

        //所持メインスキル
        this.mainSkill = [];

        //スキルアイコン
        this.skillIconSet = null;

        //キャラクター以外のオブジェクト配置用コンテナ
        this.objContainer = new PIXI.Container();

        //スキルデータ
        this.skill = [];

        //前回自動発動したスキルインデックス
        this.prevSkill = -1;

        //発動アクションインデックス
        this.nowActionIndex = -1;

        //各スキルの最終発動フレーム
        this.lastActionFrame = [];        

        //ステータス情報
        this.baseStatus = {};
        this.nowStatus = {};

        //与ダメージ合計
        this.damageDealt = 0;

        //被ダメージ合計
        this.damageTaken = 0;

        //回復量合計
        this.healDealt = 0;

        //サムネイル
        this.thum;

        // 攻撃対象
        this.attackTarget;

        //初期化処理
        this.init(_index, _infoData);
    }

    //初期化処理
    init(_index, _infoData){
        //チーム内配置
        if(Array.isArray(_infoData.pos)) this.pos = _infoData.pos;
        else this.pos = jsonContainer["userData"]["teams"][ jsonContainer["userData"]["activeTeam"] ]['pos'][_index];

        //ベースステータス構築
        this.baseStatus['lv'] = _infoData['lv'];
        this.baseStatus['type'] = _infoData['type'];

        // heroとenemy("type")に伴って参照データ分け
        for(let _stat in jsonContainer[this.baseStatus['type'] +"Data"][this.id]["baseStatus"]){
            this.baseStatus[_stat] = jsonContainer[this.baseStatus['type'] +"Data"][this.id]["baseStatus"][_stat];
        }

        //ステータス算出
        statusGet(this.baseStatus);

        //算出したステータスをもとに現在ステータス情報も形成
        for(let _stat in this.baseStatus){
            this.nowStatus[_stat] = this.baseStatus[_stat];
        }
        this.nowStatus["maxHP"] = this.baseStatus["hp"];
        this.nowStatus["charge"] = 0;


        //サムネイルテクスチャ
        this.thum = new PIXI.Sprite();
        let thumRect = jsonContainer[this.baseStatus['type'] +"Data"][this.id]['thum'];
        this.thum.texture = new PIXI.Texture(textureContainer[this.baseStatus['type'] +"_thum"], new PIXI.Rectangle(thumRect[0], thumRect[1], thumRect[2], thumRect[3]));


        //スキル情報の取得
        this.skill = jsonContainer[this.baseStatus["type"] +"Data"][this.id]['skill'];

        //自キャラの設定しているスキル情報
        this.mainSkill = _infoData["skillSet"];

        //自陣キャラのみスキルアイコンセットを作成する
        if(this.camp == "own"){
            //スキルアイコンセット構築 
            this.skillIconSet = new PIXI.Container();

            for(let i in this.mainSkill){
                //スキルID
                let skillID = this.mainSkill[i];

                //スキル情報
                let skillInfo = this.skill.find((v) => v.id === skillID);

                //サムネイル矩形
                let _rect = skillInfo["thum"]["rect"];

                //スキルアイコン
                let thum = new PIXI.Sprite(); 
                thum.texture = new PIXI.Texture(textureContainer[skillInfo["thum"]["img"]], new PIXI.Rectangle(_rect[0], _rect[1], _rect[2], _rect[3]));
                thum.x = 172 + 125 * i;
                thum.y = -65;
                thum.name = this.id +"-"+ skillID;
                this.skillIconSet.addChild(thum);
                thum.interactive = true;
                thum.on("click", this.skillExecute)
                .on("touchstart", this.skillExecute);
            }


            //キャラクターアイコン
            let _thumContainer = new PIXI.Container();
            _thumContainer.addChild(this.thum);
            _thumContainer.scale.x = -1;
            _thumContainer.x = 145;
            _thumContainer.y = -65;
            this.skillIconSet.addChild(_thumContainer);

            //スキルフレーム
            let skillFrameSpine = new PIXI.spine.Spine(spineRawData["skillFrame"]);
            this.skillIconSet.addChild(skillFrameSpine);
            this.skillIconSet.y = 980;
            if(this.mainSkill.length > 0) skillFrameSpine.state.setAnimation(0, this.mainSkill.length +'frame', true);
        }


        //キャラクターコンテナを生成
        this.container = new PIXI.Container();

        //FXコンテナを生成
        this.FXcontainer = new PIXI.Container();

        if(this.camp == "own"){
            this.opposite = "enemy";
            this.dir = 1;
        }
        else{
            this.opposite = "own";
            this.dir = -1;
        }        

        // 基本攻撃およびパッシブアクションの最終発動時間を配列に格納
        for(let i = 0; i < this.skill.length; i++){
            this.lastActionFrame.push(-1);
        }
    }

    //ステージ配置
    addStage(_spine, _anim, _pos, _spineFX){
        this.spine = _spine;
        this.anim = _anim;
        this.spineFX = _spineFX;

        this.spine.name = this.id;
        this.spineFX.name = this.id +"_fx";
        
        this.spine.scale.set(1);

        //自陣の場合はキャラクターspineを左右反転
        if(this.camp == "own") this.spine.skeleton.scaleX = -1;        

        //SPINE内イベントの文字列ラベルにキャラクターの固有変数名を代入する
        for(let _animation of this.spine.skeleton.data.animations){
            for(let i in _animation.timelines){
                for(let _prop in _animation.timelines[i]){
                    if(_prop == "events"){

                        for(let j in _animation.timelines[i][_prop]){
                            //イベントの文字列情報を「陣営コード(camp)-キャラID」
                            _animation.timelines[i][_prop][j]['stringValue'] = this.camp +'-'+ this.id;
                        }                        
                        break;
                    }
                }
            }            
        }

        //アニメーション再生
        this.spine.state.setAnimation(0, _anim, true);
        battleContent.playSpineList.push(this.spine);

        //キャラクターコンテナにspine配置
        this.container.addChild(this.spine);

        //FXコンテナにspine配置
        this.FXcontainer.addChild(this.spineFX);
        battleContent.playSpineList.push(this.spineFX);



        //HPゲージとスキルチャージを生成配置
        this.guageContainer = new PIXI.Container();

        // ゲージフレーム（角丸四角形）を描く
        let guageFrame = new PIXI.Graphics();
        guageFrame.lineStyle(4, 0xa3983d, 1);
        guageFrame.beginFill(0x000000, 0.5);

        // drawRoundedRect(x, y, width, height, cornerRadius)
        if(this.camp == "own") guageFrame.drawRoundedRect(0, 0, 150, 36, 8);
        else if(this.camp == "enemy") guageFrame.drawRoundedRect(0, 0, 150, 24, 8);
        guageFrame.endFill();

        // 位置（四角の左上が基準として）
        guageFrame.x = 0;
        guageFrame.y = 0;
        this.guageContainer.addChild(guageFrame);


        // HPバー
        this.hpBar = new PIXI.Graphics();
        this.guageContainer.addChild(this.hpBar);

        if(this.camp == "own"){
            // スキルチャージバー
            this.chargeBar = new PIXI.Graphics();
            this.guageContainer.addChild(this.chargeBar);
        }

        //ゲージフレーム位置調整
        this.guageContainer.x -= this.guageContainer.width / 2;

        //キャラクターコンテナにゲージを配置
        this.container.addChild(this.guageContainer);

        //HPの状態を更新
        this.updateHPbar();


        //キャラクターやエフェクト、その他オブジェクト用コンテナをステージに配置
        battleContent.stageContainer.addChild(this.container);
        battleContent.stageContainer.addChild(this.FXcontainer);
        battleContent.stageContainer.addChild(this.objContainer);

        // キャラクターコンテナの平面座標
        let _posX =  (width / 2) + (this.dir * 500 * -1) + (this.dir * _pos[0] * 150 * -1);
        this.container.x = _posX;

        let _posY = 820 + (_pos[1] - 1) * 100;
        this.container.y = _posY;

        // キャラクターコンテナの奥行き用座標設定
        this.setZindex();

        this.objContainer.zIndex = 900000000;
        battleContent.stageContainer.sortChildren();
    }

    //フレーム処理
    update(){
        if(this.battleMode) this.frame++;
        
        //console.log(battleContent[this.camp +'ActiveList']);

        //敵チームがいなくなったら戦闘終了
        if(battleContent[this.opposite +'ActiveList'].length == 0){          
            if(battleContent.battleEnd === false){
                battleContent.battleEnd = true;
                if(this.camp == "own") battleContent.resultFlag = "win";
                else battleContent.resultFlag = "lose";
            }
            //勝利ポーズ
            if(this.anim != "win" && this.animEndFrame <= this.frame && this.nowStatus.hp > 0){
                this.spine.state.setAnimation(0, 'win', false);
                this.anim = "win";
            }
        }
        else if(this.nowStatus.hp > 0){
            //一番距離の近い敵キャラクターを特定する
            let nearestDistance = undefined;
            let nearestID = undefined;
            for(let _oppID of battleContent[this.opposite +'ActiveList']){
                let checkTarget = battleContent[this.opposite +'TeamData'].find((v) => v.id === _oppID);
                let _distance = this.getDistance(this.container, checkTarget['container']);

                //より距離の短い相手を取得する
                if(nearestDistance === undefined || _distance < nearestDistance){
                    nearestDistance = _distance;
                    nearestID = _oppID;
                }
            }
            //もっとも近い対象
            this.attackTarget = battleContent[this.opposite +'TeamData'].find((v) => v.id === nearestID);


            //行動インデックス
            let actionIndex = -1;

            //バトル中はスキルチャージが貯まったらメインスキル処理最優先
            if(this.battleMode && this.frame > -1 && this.nowStatus["charge"] >= configJSON.chargeMax && this.mainSkill.length > 0){

                // 自動操作、および敵陣営はオートでスキル発動
                if(battleContent.battlePlay == "auto" || this.camp == "enemy"){
                    if(this.prevSkill == -1 || this.prevSkill == 2 || this.mainSkill.length == 1){
                        actionIndex = this.prevSkill = this.nowActionIndex = 1;
                    }
                    else if(this.prevSkill == 1 && this.mainSkill.length == 2){
                        actionIndex = this.prevSkill = this.nowActionIndex = 2;
                    }
                    //スキルチャージをゼロにする
                    this.updateCharge(configJSON.chargeMax * -1);
                    this.animEndFrame = this.frame;
                }
                //マニュアル操作の場合はスキルアイコンを配置
                else if(this.skillIconSet.parent === null){
                    //スキルアイコンセットを配置                    
                    this.objContainer.addChild(this.skillIconSet);
                    let iconPos = width/2 - this.skillIconSet.width/2;
                    tween.add(this.skillIconSet, "x", iconPos + 360, iconPos, 8);
                    tween.add(this.skillIconSet, "alpha", 0, 1, 15);

                    if(battleContent.battlePlay == "standby") battleContent.timeLinePause();
                }
            }

            //メインスキル発動の場合は最優先
            if(actionIndex > -1){
                        
                //対象動作の最終発動時間を登録
                this.lastActionFrame[actionIndex] = this.frame;

                //モーション開始
                this.chrActionStart(actionIndex);
                // this.spine.state.setAnimation(0, this.skill[actionIndex]['motion'], false);
                // this.anim = this.skill[actionIndex]['motion'];

                // //対象モーションの長さをspineデータから取得
                // let animData = this.spine.state.data.skeletonData.animations.find((v) => v.name === this.skill[actionIndex]['motion']);
                // //モーション終了フレームを設定
                // this.animEndFrame = this.frame + animData.duration * 60;
               
            }
            //射程範囲に敵がいない場合は一番近い敵に近づく
            else if(this.getDistance(this.container, this.attackTarget['container']) > this.skill[0]["ability"][0]['range'] && this.animEndFrame <= this.frame){
                this.container.x += this.nowStatus.walkSpeed * this.dir;

                // キャラクターコンテナの奥行き用座標設定
                this.setZindex();

                if(this.anim != "run"){
                    this.spine.state.setAnimation(0, 'run', true);
                    this.anim = "run";
                }
            }
            //戦闘開始前、攻撃対象が射程範囲に入ったら
            else if(this.battleMode === false){
                //バトルモード突入
                this.setBattleMode();
            }
            //戦闘中状態
            else if(this.battleMode === true){
                
                //移動中だった場合は歩行解除
                if(this.anim == "run"){
                    this.spine.state.setAnimation(0, 'idle', true);
                    this.anim = "idle";
                }
                else if(this.frame > -1){                    

                    //第１スキル発動していない場合は他のクールタイムをチェック
                    if(actionIndex == -1) actionIndex = this.checkCoolTime();

                    if(actionIndex > -1){
                        
                        //対象動作の最終発動時間を登録
                        this.lastActionFrame[actionIndex] = this.frame;

                        //もしまだ別のスキルのモーション中だった場合は発動しない
                        if(this.animEndFrame <= this.frame){

                            //モーション開始
                            this.chrActionStart(actionIndex);

                            // this.spine.state.setAnimation(0, this.skill[actionIndex]['motion'], false);
                            // this.anim = this.skill[actionIndex]['motion'];

                            // //対象モーションの長さをspineデータから取得
                            // let animData = this.spine.state.data.skeletonData.animations.find((v) => v.name === this.skill[actionIndex]['motion']);
                            // //モーション終了フレームを設定
                            // this.animEndFrame = this.frame + animData.duration * 60;
                        }
                        
                    }
                    //クールタイムが経過していない（行動インデックスが-1）場合は待機
                    else if(this.anim != "idle" && this.animEndFrame <= this.frame){
                        
                        //待機モーション
                        this.spine.state.setAnimation(0, 'idle', true);
                        this.anim = "idle";
                    }                 
                }                
            }
        }

        //フィルタークリア時間が設定されている場合
        if(this.filterClearTime > -1 && this.filterClearTime <= this.frame){
            this.spine.filters = [];
            this.filterClearTime = -1;
        }
    }

    //バトルモードに突入する処理（射程距離に入る or 敵から攻撃を受ける）
    setBattleMode(){
        //バトル開始フラグ
        if(battleContent.battleStarted === false) battleContent.battleStarted = true;

        this.battleMode = true;

        this.frame = 0;
        //敵陣ヒーローは行動開始にラグを加える
        if(this.camp == "enemy") this.frame -= 30;

        
        this.spine.state.clearListeners();

        //イベント通知リスナー
        this.spine.state.addListener({
            event: this.checkEvent
        });

        //１ループの完了通知リスナー
        this.spine.state.addListener({
            complete: this.animEnd
        });


        // FX再生完了リスナー
        this.spineFX.state.addListener({
            start: this.fxStart,
            complete: this.fxEnd
        });
    }

    //クールタイムチェック
    checkCoolTime(){

        //スキル配列のインデックス（0以上で行動開始）
        let actionIndex = -1;

        //最後に行動した時間の記録配列をチェック
        for(let i = this.lastActionFrame.length - 1; i >= 0; i--){
            //初回行動チェック
            let coolTime = -1;
            //初回行動の場合はイニシャルクールタイムをクールタイムに設定
            //if(this.id == "e001_archer") console.log(this.skill, i, this.lastActionFrame);

            if(this.lastActionFrame[i] == -1 && this.skill[i].initialCoolTime > 0) coolTime = this.skill[i].initialCoolTime;
            else coolTime = this.skill[i].coolTime;

            //クールタイムがないものは行動対象から除外
            if(coolTime == -1) continue;

            //クールタイムを満たしていた場合、行動インデックスを設定
            if(this.frame - this.lastActionFrame[i] >= coolTime){
                actionIndex = i;
                break;
            }
        }

        return actionIndex;
    }

    //スキル発動
    skillExecute(e){
        //スキルアイコンのIDを取得
        let _id = e.target.name.split("-")[0];
        //スキルID
        let _skillID = e.target.name.split("-")[1];
        //ヒーローオブジェクト捜索
        let _hero = battleContent.ownTeamData.find((v) => v.id === _id);
        //スキル実行
        _hero.skillHandler(_skillID);
    }

    skillHandler(_skillID){
        this.objContainer.removeChild(this.skillIconSet);

        let actionIndex = this.skill.findIndex((v) => v.id === _skillID);

        //スキルチャージをゼロにする
        this.updateCharge(configJSON.chargeMax * -1);
        this.animEndFrame = this.frame;

        //対象動作の最終発動時間を登録
        this.lastActionFrame[actionIndex] = this.frame;

        //モーション開始
        this.chrActionStart(actionIndex);
        // this.nowActionIndex = actionIndex;
        // this.spine.state.setAnimation(0, this.skill[actionIndex]['motion'], false);
        // this.anim = this.skill[actionIndex]['motion'];

        // //対象モーションの長さをspineデータから取得
        // let animData = this.spine.state.data.skeletonData.animations.find((v) => v.name === this.skill[actionIndex]['motion']);
        // //モーション終了フレームを設定
        // this.animEndFrame = this.frame + animData.duration * 60;

        if(battleContent.battlePlay == "standby") battleContent.timeLineRestart();

    }

    //キャラクターおよびエフェクトモーション再生
    chrActionStart(actionIndex){

        this.nowActionIndex = actionIndex;

        //モーション強制開始
        this.anim = this.skill[actionIndex]['motion'];
        this.spine.state.setAnimation(0, this.anim, false);
        

        //対象モーションの長さをspineデータから取得
        let animData = this.spine.state.data.skeletonData.animations.find((v) => v.name === this.anim);
        //モーション終了フレームを設定
        this.animEndFrame = this.frame + animData.duration * 60;

        //エフェクト配置
        let fxIndex = this.spineFX.skeleton.data.animations.findIndex((v) => v.name === this.anim);
        // 該当モーションのエフェクトがあればエフェクトspineを再生する
        if(fxIndex > -1){
            //FXコンテナの位置をリセット
            this.FXcontainer.x = this.FXcontainer.y = 0;

            // 発出ポイントの目印ボーン
            let shotPointBone = this.spine.skeleton.bones.find((v) => v.data.name === "shotPoint");
            let shotPoint;
            let shotBone;
            let beamBone;

            if(shotPointBone){
                // 発射物ボーン
                shotBone = this.spineFX.skeleton.bones.find((v) => v.data.name === "shot");
                beamBone = this.spineFX.skeleton.bones.find((v) => v.data.name === "beam");
                
                shotPoint = this.FXcontainer.toLocal({"x":shotPointBone.worldX, "y":shotPointBone.worldY}, this.spine);                
            }

            // 命中ポイントの目印ボーン
            let hitPointBone = this.attackTarget.spine.skeleton.bones.find((v) => v.data.name === "hitPoint");

            // 射出型(矢・弾丸等)のタイプの処理
            if(hitPointBone && shotPoint){
                // 命中位置
                let hitPoint = this.FXcontainer.toLocal({"x":hitPointBone.worldX, "y":hitPointBone.worldY}, this.attackTarget.spine);

                //エフェクトコンテナを射出位置に移動
                this.FXcontainer.x = shotPoint.x;
                this.FXcontainer.y = shotPoint.y;

                // 射出角度
                let _radian = Math.atan2(shotPoint.y - hitPoint.y, shotPoint.x - hitPoint.x);
                let _angle = _radian * (180 / Math.PI);
                //console.log(this.id, _angle);

                if(shotBone){
                    let angleAdjust = 0;
                    // if(this.camp == "enemy") angleAdjust = -180;
                    shotBone.rotation = 180 - _angle + angleAdjust;
                    shotBone.x = 0;
                    shotBone.y = 0;
                }
                else if(beamBone){
                    let angleAdjust = 0;
                    // if(this.camp == "enemy") angleAdjust = 180;
                    beamBone.rotation = 180 - _angle + angleAdjust;
                    beamBone.x = 0;
                    beamBone.y = 0;
                }

                //tween.add(shotBone, "rotation", 0, 180, 120);

                // 移動量
                let _xDist = hitPoint.x - shotPoint.x;
                let _yDist = hitPoint.y - shotPoint.y;
                //console.log(_xDist, _yDist);

                // 射出物の移動型（敵の命中位置にヒット）
                if(shotBone){
                    let shotBoneIndex = this.spineFX.skeleton.data.bones.findIndex((v) => v.name === "shot");

                    let targetTimelineIndex = -1;
    
                    // タイムラインプロパティから、shotボーンの位置プロパティのものを捜索
                    for(let i = 0; i < this.spineFX.skeleton.data.animations[fxIndex].timelines.length; i++){
                        let _timeline = this.spineFX.skeleton.data.animations[fxIndex].timelines[i];
    
                        if(_timeline.boneIndex === shotBoneIndex && _timeline.constructor.name === "TranslateTimeline"){
                            targetTimelineIndex = i;
                            break;
                        }
                    }
    
                    // タイムラインのFramesデータはマトリックス型
                    // TranslateTimeline、ScaleTimeline 0:時間, 1:X軸, 2:Y軸
                    // RotationTimeline 0:時間, 1:角度                
                    
                    if(targetTimelineIndex > -1){
                        // アニメーションタイムラインを編集
                        let targetTimeLine = this.spineFX.skeleton.data.animations[fxIndex].timelines[targetTimelineIndex];
    
                        let startTime = targetTimeLine.frames[0];
                        let endTime = targetTimeLine.frames[3];
    
                        let startPosX = targetTimeLine.frames[1];
                        let startPosY = targetTimeLine.frames[2];
    
                        let endPosX = startPosX + _xDist;
                        let endPosY = startPosY - _yDist;
    
                        targetTimeLine.setFrame(1, startTime, startPosX, startPosY);
                        targetTimeLine.setFrame(1, endTime, endPosX, endPosY);
    
                        this.spineFX.state.setAnimation(0, this.anim, false);
                    }
                }
                // ビーム型（敵の命中位置に伸びるタイプ）
                else if(beamBone){

                    let beamBoneIndex = this.spineFX.skeleton.data.bones.findIndex((v) => v.name === "beam");

                    let targetTimelineIndex = -1;

                    // タイムラインプロパティから、beamボーンのスケールプロパティのものを捜索
                    for(let i = 0; i < this.spineFX.skeleton.data.animations[fxIndex].timelines.length; i++){
                        let _timeline = this.spineFX.skeleton.data.animations[fxIndex].timelines[i];
                        //console.log(_timeline.boneIndex, beamBoneIndex, _timeline.constructor.name);
                        if(_timeline.boneIndex === beamBoneIndex && _timeline.constructor.name === "ScaleTimeline"){
                            targetTimelineIndex = i;
                            break;
                        }
                    }

                    // ScaleTimeline 0:時間, 1:X軸, 2:Y軸
                    if(targetTimelineIndex > -1){
                        // アニメーションタイムラインを編集
                        let targetTimeLine = this.spineFX.skeleton.data.animations[fxIndex].timelines[targetTimelineIndex];
    
                        //console.log(this.spineFX.skeleton);
                        let beamSlot = this.spineFX.skeleton.slots.find((v) => v.currentSpriteName === "beam");
                        let beamHeight = beamSlot.sprites.beam.attachment.height;

                        let _distance = Math.sqrt ( Math.pow(_xDist, 2) + Math.pow(_yDist, 2) );

                        let beamScale = _distance / beamHeight;

                        // 開始時間
                        let startTime = targetTimeLine.frames[0];
                        // 終了時間
                        let endTime = targetTimeLine.frames[3];
    
                        // 開始スケール
                        let startScaleX = targetTimeLine.frames[1];
                        let startScaleY = targetTimeLine.frames[2];
    
                        // 終了スケール
                        let endScaleX = beamScale;
                        let endScaleY = startScaleY;
    
                        targetTimeLine.setFrame(1, startTime, startScaleX, endScaleX);
                        targetTimeLine.setFrame(1, endTime, endScaleX, endScaleY);
    
                        this.spineFX.state.setAnimation(0, this.anim, false);
                    }
                }                
            }
        }
    }

    //アニメーションのイベント取得
    checkEvent(obj, e){
        //イベント情報
        let action = e.data.name;
        let camp = e.stringValue.split("-")[0];
        let id = e.stringValue.split("-")[1];

        //ヒーローオブジェクトのイベント処理を呼び出し
        let actionHero = battleContent[camp +"TeamData"].find((v) => v.id === id);
        actionHero.actionDeal(action);
    }

    //アクションイベント受け取り処理
    actionDeal(action){
        //アクション発生タイミングでチャージ100追加
        this.updateCharge(100);

        //イベント名からスキルインデックスを取得
        //let skill_index = action.split("_")[1];
        let skill_index = this.nowActionIndex;

        //if(skill_index == 1) console.log(this.skill[skill_index]["name"][lang]);
        
        //動作処理（スキル動作内容をすべて確認）
        for(let key in this.skill[skill_index]["behavior"]){

            // 発動アクション名 確認
            //console.log(this.skill[skill_index]["name"][lang]);

            let behavior = this.skill[skill_index]["behavior"][key];
            //スキル能力
            let ability = this.skill[skill_index]["ability"][key];
            //動作タイプに合わせて処理分け
            switch(behavior){
                //単純攻撃型
                case "ATTACK":
                    //スキル攻撃力
                    //let attackValue = ability['base'] * this.nowStatus[ ability["statusType"] ] + ability['levelRate'] * this.nowStatus["lv"];

                    //射程距離
                    let attackRange = ability['range'];

                    //射程範囲
                    let attackArea = ability['area'];

                    //相手チーム(アクティブリスト)の射程範囲のキャラクターすべてにダメージを与える
                    for(let targetID of battleContent[this.opposite +"ActiveList"]){

                        //アクティブリストのIDから対象オブジェクトを取得
                        let targetObj = battleContent[this.opposite +"TeamData"].find((v) => v.id === targetID);                     

                        // 攻撃対象との距離が射程距離および射程範囲内の場合
                        if(this.getDistance(this.container, targetObj.container) <= (attackRange + attackArea/2)){                            

                            //与えるダメージを算出する
                            let attackValueObj = getDamageValue(this.nowStatus, ability, targetObj.nowStatus);

                            //与ダメージ量が相手の残りHPより大きい場合はHPの値にする
                            if(targetObj.nowStatus.hp < attackValueObj["value"]) attackValueObj["value"] = targetObj.nowStatus.hp;

                            //与ダメージ合計に追加
                            this.damageDealt += attackValueObj["value"];

                            //攻撃相手より自分の方が上位レイヤーに来るよう重なり順を操作
                            this.FXcontainer.zIndex = targetObj.container.zIndex + 5;
                            battleContent.stageContainer.sortChildren();
                            // if(battleContent.stageContainer.getChildIndex(this.container) < battleContent.stageContainer.getChildIndex(targetObj.container)){
                            //     battleContent.stageContainer.swapChildren(this.container, targetObj.container);
                            // }                            

                            //攻撃対象にアクション処理を渡す
                            targetObj.actionedDeal(this, attackValueObj);
                        }
                    }
                    break;
                //バフ型
                case "BUFF":

                    let buffValue = ability['base'] * this.nowStatus[ability['statusType']] + ability['levelRate'] * this.nowStatus["lv"];
                    //console.log("バフ："+ ability["targetStatus"] +"+"+ buffValue);
                    this.nowStatus[ability["targetStatus"]] += buffValue;

                    break;
                //デバフ型
                case "DEBUFF":
                    break;
                //ヒール型
                case "HEAL":
                    if(ability['target'] == "all"){
                        //味方全員を回復
                        for(let targetID of battleContent[this.camp +"ActiveList"]){

                            let targetObj = battleContent[this.camp +"TeamData"].find((v) => v.id === targetID);

                            //回復値を算出する
                            let healValueObj = getHealValue(this.nowStatus, ability, targetObj.nowStatus);

                            //回復値が相手の最大HPより大きくなる場合は最大HPまでの値にする
                            if((targetObj.nowStatus.maxHP - targetObj.nowStatus.hp) < healValueObj["value"]) healValueObj["value"] = (targetObj.nowStatus.maxHP - targetObj.nowStatus.hp);

                            //与ダメージ合計に追加
                            this.healDealt += healValueObj["value"];

                            //回復相手より自分の方が上位レイヤーに来るよう重なり順を操作
                            this.FXcontainer.zIndex = targetObj.container.zIndex + 5;
                            battleContent.stageContainer.sortChildren();

                            // if(battleContent.stageContainer.getChildIndex(this.container) < battleContent.stageContainer.getChildIndex(targetObj.container)){
                            //     battleContent.stageContainer.swapChildren(this.container, targetObj.container);
                            // }                            

                            //回復対象にアクション処理を渡す
                            targetObj.actionedDeal(this, healValueObj);
                        }
                    }
                    break; 
            }
        }
    }

    //第三者からのアクションに対する処理
    actionedDeal(dealer, damageInfo){

        //白く光るフィルター
        let filter = new PIXI.filters.ColorMatrixFilter();
        filter.alpha = 0.5;
        filter.tint(0xff0000, false);
        filter.brightness(1.8,false);

        //攻撃者の攻撃威力（回復威力）
        let damageValue = damageInfo['value'];

        if(damageInfo['type'] == "heal"){
            this.updateHPbar(damageValue);
        }
        else{
            //HPの状態を更新
            if(this.updateHPbar(damageValue * -1) == 0){
                //死亡処理
                this.deadHandler(dealer);
            }
            //被ダメージ合計に追加
            this.damageTaken += damageValue;
        }      

        //ダメージ情報表示
        this.buildActionNumbers(this, damageInfo);

        if(!this.battleMode){
            //バトルモード突入
            this.setBattleMode();
        }
        if(this.frame < 0) this.frame = 0;

        //動作タイプに合わせて処理分け
        switch(damageInfo['type']){
            //物理攻撃ヒット
            case "physical":                
                this.spine.filters = [filter];
                this.filterClearTime = this.frame + 12;
                break;
            //クリティカルヒット
            case "critical":
                this.spine.filters = [filter];
                this.filterClearTime = this.frame + 12;
                break;
            //回避
            case "dodge":

                break;
            //回復
            case "heal":
                this.spine.filters = [filter];
                this.filterClearTime = this.frame + 12;
                break;
        }
    }

    //HPバー更新
    updateHPbar(add = 0){
        // 変動値(add)をHPに追加
        let _hp = Number(this.nowStatus["hp"]) + add;

        if(_hp < 0) _hp = 0;
        else if(_hp > Number(this.nowStatus["maxHP"])) _hp = Number(this.nowStatus["maxHP"]);

        //被ダメージの場合、スキルチャージに割合追加
        if(add < 0){
            // 最大HPに対するダメージ割合
            let damageRate = Math.abs(add) / Number(this.nowStatus["maxHP"]);
            // 同割合分、スキルチャージを充填
            let addCharge = damageRate * 1000;
            this.updateCharge(addCharge);
        }

        // HPを更新
        this.nowStatus["hp"] = _hp;

        // 現在HPの割合
        let hpRate = (_hp / Number(this.nowStatus["maxHP"]));
        // HPバーの長さを更新
        this.hpBar.clear();
        this.hpBar.lineStyle(1, 0x000000, 0.1);
        if(this.camp == "own") this.hpBar.beginFill(0x41d500, 1);
        else if(this.camp == "enemy") this.hpBar.beginFill(0xc10c0c, 1);

        // drawRoundedRect(x, y, width, height, cornerRadius)
        this.hpBar.drawRoundedRect(6, 6, Math.floor((this.guageContainer.width - 16) * hpRate), 12, 5)
        this.hpBar.endFill();

        return _hp;
    }

    //スキルチャージ更新
    updateCharge(add = 0){
        let _charge = this.nowStatus["charge"] + add;
        if(_charge < 0) _charge = 0;
        else if(_charge > configJSON.chargeMax) _charge = configJSON.chargeMax;

        this.nowStatus["charge"] = _charge;

        if(this.camp == "own"){
            let chargeRate = (_charge / configJSON.chargeMax);
            this.chargeBar.clear();
            this.chargeBar.lineStyle(1, 0x000000, 0.1);
            this.chargeBar.beginFill(0x117eee, 1);

            // drawRoundedRect(x, y, width, height, cornerRadius)
            this.chargeBar.drawRoundedRect(6, 20, Math.floor((this.guageContainer.width - 16) * chargeRate), 12, 5)
            this.chargeBar.endFill();
        }

        return _charge;
    }

    //戦闘不能処理
    deadHandler(dealer){
        this.spine.state.setAnimation(0, 'dead', false);

        // スキルチャージをゼロにする
        this.nowStatus["charge"] = 0;
        this.updateCharge();

        //スキルフレームがある場合は除去する
        if(this.skillIconSet !== null && this.skillIconSet.parent !== null){

            //this.skillIconSet.removeChild(this.skillThum);
            //console.log(this.skillIconSet.parent.children);
            this.objContainer.removeChild(this.skillIconSet);
        }

        let myTeamIndex = battleContent[this.camp +'ActiveList'].indexOf(this.id);

        battleContent[this.camp +'ActiveList'].splice(myTeamIndex, 1);

        //HPバー除去
        this.container.removeChild(this.guageContainer);

        let filter = new PIXI.filters.ColorMatrixFilter();
        filter.alpha = 0.6;
        filter.tint(0x440000, false);
        filter.sepia = true;
        this.container.filters = [filter];
    }

    //効果メッセージをキャラクターの頭上に表示
    buildActionNumbers(target, damageInfo){
        let numContainer = new PIXI.Container();

        numContainer.x = 0;

        //すでに配置してある数値コンテナと干渉しない位置に配置
        numContainer.y = -250;
        for(let _cInfo of battleContent.numContainerList){
            if(target.container != _cInfo['container']) continue;
            if(_cInfo['obj'].y == numContainer.y) numContainer.y -= 40;
        }
        
        target.container.addChild(numContainer);

        if(damageInfo["value"] > 0){
            let numString = String(damageInfo["value"]);

            for(let i = 0; i < numString.length; i++){
    
                let targetNum = numString.charAt(i);
    
                // 数字テクスチャ
                let img = new PIXI.Sprite(); 
                //const texture = textureContainer["battle_ui"];        
                //img.texture = new PIXI.Texture(texture, new PIXI.Rectangle(30 * (Number(targetNum) + 1), 40, 30, 40));
                img.texture = battleContent.textureList[damageInfo["type"]][Number(targetNum)].clone();
                img.x = i * 27;
                numContainer.addChild(img);
            }
            
            if(damageInfo["type"] == "critical"){
                numContainer.pivot.x = numContainer.width / 2;
                numContainer.pivot.y = numContainer.height / 2;
                numContainer.scale.x = numContainer.scale.y = 2.5;
                tween.add(numContainer, "scale", 2.5, 1.5, 8);
            }
            
        }
        else{
            switch(damageInfo["type"]){
                //回避表示
                case "dodge":
                    let text = new PIXI.Text(jsonContainer["language"]["battle"]["dodge"][lang], {fontFamily : 'Arial', fontWeight: 'bold', fontSize: 32, fill : 0xffffff, align : 'left', stroke:'#000000', strokeThickness:5});
                    numContainer.addChild(text);
                    break;
            }
        }     

        let containerInfo = {"container":target.container, "obj":numContainer, "dir":(target.dir * -1), "birth":battleContent.frame};
        battleContent.numContainerList.push(containerInfo);
    }

    // アニメーションのループエンドを取得
    animEnd(e){
        //console.log(e);
    }

    // FX再生開始
    fxStart(e){
        //console.log(e);
    }

    // FX再生完了
    fxEnd(e){
        //console.log(e);
    }

    // キャラクターのZ座標計算
    setZindex(){
        let _posZ = (width / 2) - Math.abs(this.container.x - (width / 2)) * 10;
        _posZ += (this.container.y - 620) * 1000000;

        // キャラクターコンテナの奥行き用座標
        this.container.zIndex = _posZ;
        this.FXcontainer.zIndex = _posZ + 5;

        this.container.scale.x = this.container.scale.y = 0.9 + (this.container.y - 620) / 2000;

        battleContent.stageContainer.sortChildren();
    }

    // 2体の距離を求めるメソッド
    getDistance(obj, target){
        return Math.sqrt(Math.pow(target.x - obj.x, 2) + Math.pow(target.y - obj.y, 2));
    }
}