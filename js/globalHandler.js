// コンテンツページ移動処理
function contentTransfer(_next, _nowContent, _aug = null){
    //現在のコンテンツの更新処理を解除
    for(let i = 0; i < updateTarget.length; i++){
        if(updateTarget[i] == _nowContent)  updateTarget.splice(i, 1);
    }
    //現在のコンテンツの描画処理を解除
    for(let i = 0; i < renderTarget.length; i++){
        if(renderTarget[i] == _nowContent)  renderTarget.splice(i, 1);
    }

    //現在のコンテンツステージから除去
    app.stage.removeChild(_nowContent.sceneContainer);

    //現在のコンテンツオブジェクトを削除
    _nowContent = null;

    //画面サイズを調整
    resize();

    //指定コンテンツに移動
    if(_aug !== null) functionObject[_next](_aug);
    else functionObject[_next]();
}

//キャラクターの育成状態からステータスを算出
function statusGet(statList){
    let plus = statList['lv'] * 3;

    statList["physicalAttack"] += plus;
}

//キャラクターIDと設定情報からステータス配列を構築
function getStatusInfo(_id, _heroInfo){
    let _lv = _heroInfo["lv"];
    let _statusData = jsonContainer[_heroInfo['type'] +"Data"][_id]["baseStatus"];

    let _buildStatus = {};
    for(let _stat in _statusData){
        let _statValue = Number(_statusData[_stat]);

        switch(_stat){
            case "hp":
                _statValue += _lv * 5;
            case "physicalAttack":
                _statValue += _lv * 3;
            case "physicalArmor":
                _statValue += _lv * 1;
        }
        _buildStatus[_stat] = _statValue;
    }

    return _buildStatus;
}

//ダメージ計算出力(オブジェクト形式)
function getDamageValue(_attacker, _skillInfo, _reciever){

    //攻撃結果の型
    let damageType = _skillInfo["damageType"];

    //スキルの攻撃ステータスタイプ
    let statusType = _skillInfo["statusType"];

    //攻撃者の攻撃ステータス(物理or魔法攻撃)
    let attackValue = _attacker[statusType];

    //スキルの攻撃値
    let damageValue = _skillInfo['base'] * attackValue + _skillInfo['levelRate'] * _attacker["lv"];

    //受け手の防御力(物理or魔法アーマー)
    let defValue = _reciever[_skillInfo["damageType"] +"Armor"];

    //防御による減算率
    let defRate = ( 1 / ( 1 + ( ( defValue - _attacker[ damageType +"Penetration"] ) / 3000 ) ) );

    //console.log(damageValue , defRate);

    //ダメージに減算率をかける
    damageValue *= defRate;

    //物理の場合はクリティカルおよび回避判定
    if(_skillInfo["damageType"] == "physical"){
        //クリティカル率
        let criticalRate = _attacker["critical"] / (_attacker["critical"] + _reciever["resist"]);
        //クリティカル乱数
        let critRandom = Math.random();
        //クリティカル判定
        if(criticalRate >= critRandom){
            damageValue *= 2;
            damageType = "critical";
        }

        //回避率
        let dodgeRate = _reciever["dodge"] / (_reciever["dodge"] + _attacker["resist"]);
        //回避乱数
        let dodgeRandom = Math.random();
        //回避判定
        if(dodgeRate >= dodgeRandom){
            damageValue = 0;
            damageType = "dodge";
        }
    }

    //出力
    return {"type":damageType, "value":Math.floor(damageValue)};
}

//回復量算出
function getHealValue(_healer, _skillInfo, _reciever){
    //スキルの使用ステータスタイプ
    let statusType = _skillInfo["statusType"];

    //回復者の回復ステータス(物理or魔法攻撃)
    let healValue = _healer[statusType];

    //スキルの回復値
    let healHPvalue = _skillInfo['base'] * healValue + _skillInfo['levelRate'] * _healer["lv"];

    //出力
    return {"type":"heal", "value":Math.floor(healHPvalue)};
}

class Tween{
    constructor(){
        this.TweenList = [];
    }

    render(){
        for( let i = this.TweenList.length-1; i >= 0; i--){
            let _tweenInfo = this.TweenList[i];

            if(_tweenInfo["type"] == "motion"){
                if(_tweenInfo["prop"] == "scale"){
                    _tweenInfo["target"][ _tweenInfo["prop"] ]["x"] += _tweenInfo["stepValue"];
                    _tweenInfo["target"][ _tweenInfo["prop"] ]["y"] += _tweenInfo["stepValue"];
                }
                else _tweenInfo["target"][ _tweenInfo["prop"] ] += _tweenInfo["stepValue"];
    
                if(totalFrame == _tweenInfo["endFrame"]){
                    if(_tweenInfo["prop"] == "scale"){
                        _tweenInfo["target"][ _tweenInfo["prop"] ]["x"] = _tweenInfo["toValue"];
                        _tweenInfo["target"][ _tweenInfo["prop"] ]["y"] = _tweenInfo["toValue"];
                    }
                    else _tweenInfo["target"][ _tweenInfo["prop"] ] = _tweenInfo["toValue"];
    
                    this.TweenList.splice(i, 1);
                }
            }
            else if(_tweenInfo["type"] == "barDraw"){
                let _g = _tweenInfo["target"];

                _tweenInfo["frameCount"]++;

                _g.lineStyle(_tweenInfo["lineBold"], _tweenInfo["lineColor"], _tweenInfo["lineAlpha"]);
                _g.beginFill(_tweenInfo["color"], _tweenInfo["opacity"]);

                let _width = _tweenInfo["fromValue"] + _tweenInfo["frameCount"]*_tweenInfo["stepValue"];
                if(_width > _tweenInfo["toValue"]) _width = _tweenInfo["toValue"];
                _g.drawRoundedRect(0, 0,  _width, _tweenInfo["height"], _tweenInfo["round"]);
                _g.endFill();

                if(totalFrame == _tweenInfo["endFrame"]){

                    _g.lineStyle(_tweenInfo["lineBold"], _tweenInfo["lineColor"], _tweenInfo["lineAlpha"]);
                    _g.beginFill(_tweenInfo["color"], _tweenInfo["opacity"]);
    
                    let _width = _tweenInfo["toValue"];
                    _g.drawRoundedRect(0, 0,  _width, _tweenInfo["height"], _tweenInfo["round"]);
                    _g.endFill();

                    this.TweenList.splice(i, 1);
                }
            }
            
        }
    }

    //プロパティ値の単純変化要素追加
    add(_target, _prop, _fromValue, _toValue, _frame){
        let _tweenInfo = {
            "target":_target,
            "prop":_prop,
            "fromValue":_fromValue,
            "toValue":_toValue,
            "stepValue":((_toValue - _fromValue) / _frame),
            "frame":_frame,
            "nowFrame":totalFrame,
            "endFrame":totalFrame + _frame,
            "type":"motion"
        };

        if( _prop == "scale"){
            _target[ _prop ]["x"] = _fromValue;
            _target[ _prop ]["y"] = _fromValue;
        }
        else _target[ _prop ] = _fromValue;

        this.TweenList.push(_tweenInfo);
    }

    //バーの伸縮描画要素追加(Graphicオブジェクト, 所要フレーム, 開始の長さ, 終了の長さ, 角丸, 色, 透明度, 線の太さ, 線の色, 線の透明度)
    addDrawBar(_g, _frame, _fromValue, _toValue, _height, _round, _color, _opacity, _lineB, _lineC, _lineA){

        let _tweenInfo = {
            "target":_g,
            "frame":_frame,
            "fromValue":_fromValue,
            "toValue":_toValue,
            "stepValue":((_toValue - _fromValue) / _frame),
            "height":_height,
            "round":_round,
            "color":_color,
            "opacity":_opacity,
            "lineBold":_lineB,
            "lineColor":_lineC,
            "lineAlpha":_lineA,
            "type":"barDraw",
            "nowFrame":totalFrame,
            "endFrame":totalFrame + _frame,
            "frameCount":0
        }

        this.TweenList.push(_tweenInfo);        
    }
}

//キャラクターアイコン＆フレーム生成
function buildHeroIcon(heroInfo){

    //コンテナ
    let _container = new PIXI.Container();

    //サムネイルテクスチャ
    let thum = new PIXI.Sprite();
    let thumRect = jsonContainer[heroInfo['type'] +"Data"][heroInfo['id']]['thum'];
    thum.texture = new PIXI.Texture(textureContainer[heroInfo['type'] +"_thum"], new PIXI.Rectangle(thumRect[0], thumRect[1], thumRect[2], thumRect[3]));
    thum.scale.x = -1;
    thum.x = thum.width + 5;
    thum.y = 5;

    _container.addChild(thum);

    //サムネイルフレーム
    let frame = new PIXI.Sprite(); 
    frame.texture = new PIXI.Texture(textureContainer["frames"], new PIXI.Rectangle(0, 0, 130, 130));
    _container.addChild(frame);

    //レベルフレーム
    let lvFrame = new PIXI.Sprite();
    lvFrame.texture = new PIXI.Texture(textureContainer["frames"], new PIXI.Rectangle(0, 390, 86, 43));
    _container.addChild(lvFrame);
    lvFrame.x = 22;
    lvFrame.y = 105;

    //レベル
    let text = new PIXI.Text(heroInfo['lv'], {fontFamily : 'Arial', fontSize: 30, fill : 0xfff9c3, align : 'center', wordWrapWidth: 100});
    text.anchor.x = 0.5;
    text.x = 65;
    text.y = 108;
    _container.addChild(text);

    _container.name = heroInfo['id'];

    return _container;

}

// その他アイコン＆フレーム構築
function buildIcon(img, thumRect, lv){
    //コンテナ
    let _container = new PIXI.Container();

    //サムネイルテクスチャ
    let thum = new PIXI.Sprite();
    thum.texture = new PIXI.Texture(img, new PIXI.Rectangle(thumRect[0], thumRect[1], thumRect[2], thumRect[3]));
    thum.x = 5;
    thum.y = 5;

    _container.addChild(thum);

    //サムネイルフレーム
    let frame = new PIXI.Sprite(); 
    frame.texture = new PIXI.Texture(textureContainer["frames"], new PIXI.Rectangle(0, 0, 130, 130));
    _container.addChild(frame);

    //レベルフレーム
    let lvFrame = new PIXI.Sprite();
    lvFrame.texture = new PIXI.Texture(textureContainer["frames"], new PIXI.Rectangle(0, 390, 86, 43));
    _container.addChild(lvFrame);
    lvFrame.x = 22;
    lvFrame.y = 105;

    //レベル
    let text = new PIXI.Text(lv, {fontFamily : 'Arial', fontSize: 30, fill : 0xfff9c3, align : 'center', wordWrapWidth: 100});
    text.anchor.x = 0.5;
    text.x = 65;
    text.y = 108;
    _container.addChild(text);

    return _container;
}

//クッキーデータ管理
function cookieUpdate(){
    //クッキー読み込み
    let cookieArray = document.cookie.split(';');

    cookieData = {};
    for(let i = 0; i < cookieArray.length; i++){
        let splitIndex = cookieArray[i].indexOf('=');
        cookieData[cookieArray[i].substring(0, splitIndex).trim()] = cookieArray[i].substring(splitIndex + 1).trim();
    }

    //クッキーが取得できない場合は汎用値を設定
    // if(!cookieData["lang"]){
    //     cookieData["lang"] = BrowserLanguage;
    //     document.cookie = "lang="+ cookieData["lang"];
    // }     
}

//文字列暗号化
function Crypt(str){
    // RSA鍵
    let PassPhrase = GamePhrase;
    let Bits = 1024;
    let MattsRSAkey = cryptico.generateRSAKey(PassPhrase, Bits);

    // 公開鍵
    let MattsPublicKeyString = cryptico.publicKeyString(MattsRSAkey);

    // 暗号化
    let EncryptionResult = cryptico.encrypt(str, MattsPublicKeyString);

    return EncryptionResult.cipher;
}
//復号化
function Decrypt(str){
    // RSA鍵
    let PassPhrase = GamePhrase;
    let Bits = 1024;
    let MattsRSAkey = cryptico.generateRSAKey(PassPhrase, Bits);

    // 復号化
    let DecryptionResult = cryptico.decrypt(str, MattsRSAkey);

    return DecryptionResult.plaintext;
}
