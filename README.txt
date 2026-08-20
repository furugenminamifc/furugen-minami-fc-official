古堅南FC 公式ホームページ Ver.1.5.3
======================================

■ Ver.1.5.3「実スタッフ登録・プロフィール完成版」

スタッフ紹介を、公式ホームページとして実運用できるプロフィール形式へ強化しました。

■ 登録できる項目
- 氏名
- ふりがな
- 役職
- 担当カテゴリー
- 資格
- 経歴
- メッセージ
- 写真
- 写真表示位置
- SNSリンク
- 公開 / 非公開

■ 写真追加
images/staff/ に画像を追加して、
data/staff.json の photo にパスを入力してください。

■ 例
{
  "role": "コーチ",
  "name": "氏名",
  "nameKana": "しめい",
  "category": "U-12",
  "license": "JFA公認D級コーチ",
  "career": "指導歴など",
  "message": "メッセージ",
  "photo": "images/staff/coach-02.webp",
  "photoPosition": "center 35%",
  "snsLabel": "Instagram",
  "snsUrl": "",
  "isPublished": true
}

■ GitHub
更新用ZIPを展開してアップロードしてください。
