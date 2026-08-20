古堅南FC 公式ホームページ Ver.1.6.8
======================================

■ Ver.1.6.8「実選手登録かんたん入力版」

JSONを直接編集しなくても、
player-manager.html のフォーム入力だけで
選手データを作れるように改善しました。

■ かんたん入力項目
- U-12 / U-11 / U-10
- 背番号
- 氏名
- ふりがな
- 学年
- ポジション
- 利き足
- 写真ファイル名
- 写真位置
- CAPTAIN
- 公開 / 非公開
- ひとこと紹介

■ 使い方
1. player-manager.html を開く
2. 選手情報を入力
3. 「この選手を追加」
4. 全選手入力後「players.jsonを保存」
5. GitHubの data/players.json と入れ替える

■ 写真
写真は GitHub の
images/players/
へアップロードしてください。

入力画面では
u12-08-taro.webp
のようにファイル名だけ入力すれば、
自動で images/players/ を付けます。

■ 公開ページ
players.html は従来どおり一般公開向けです。
管理入力画面は player-manager.html です。

■ GitHub
「更新用ファイルのみ」ZIPを展開してアップロードしてください。
