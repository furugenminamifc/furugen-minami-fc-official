古堅南FC 公式ホームページ Ver.1.5.2
======================================

■ Ver.1.5.2「スタッフ登録・写真対応版」

スタッフページを、写真付きの実運用に対応させました。

■ 新機能
- スタッフ写真対応
- 氏名 / 役職 / 担当 / 資格 / メッセージ登録
- photoPosition で写真の表示位置調整
- isPublished で公開 / 非公開を切替
- 画像がない場合は COACH / STAFF の仮表示
- 写真読み込みエラー時もレイアウトを崩さない
- data/staff-entry-template.json を追加

■ 写真追加方法
1. 画像を images/staff/ に入れる
2. data/staff.json の photo に
   "images/staff/ファイル名.webp"
   と入力
3. isPublished を true にする

■ 例
{
  "role": "コーチ",
  "name": "氏名",
  "category": "U-12",
  "license": "JFA公認D級コーチ",
  "message": "メッセージ",
  "photo": "images/staff/coach-02.webp",
  "photoPosition": "center 35%",
  "isPublished": true
}

■ GitHub
「更新用ファイルのみ」ZIPを展開してアップロードしてください。
