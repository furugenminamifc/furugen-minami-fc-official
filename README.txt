古堅南FC 公式ホームページ Ver.1.6.1
======================================

■ Ver.1.6.1「実選手登録・写真対応版」

選手紹介ページを、実際の選手登録に使えるプロフィール形式へ拡張しました。

■ 登録できる項目
- カテゴリー
- 背番号
- 氏名
- ふりがな
- 学年
- ポジション
- 利き足
- プロフィール / ひとこと紹介
- 写真
- 写真表示位置
- 公開 / 非公開

■ 写真
images/players/ に写真を追加してください。

■ JSON
data/players.json に選手情報を登録します。

■ 例
{
  "category": "U-12",
  "number": 10,
  "name": "氏名",
  "nameKana": "しめい",
  "grade": "6年生",
  "position": "MF / FW",
  "dominantFoot": "右",
  "profile": "プレースタイル・ひとこと紹介",
  "photo": "images/players/u12-02.webp",
  "photoPosition": "center 35%",
  "isPublished": true
}

■ 個人情報
誕生日・住所・連絡先などは初期状態では公開しません。

■ GitHub
「更新用ファイルのみ」ZIPを展開してアップロードしてください。
