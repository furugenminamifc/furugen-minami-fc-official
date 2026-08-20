古堅南FC 公式ホームページ Ver.1.5.4
======================================

■ Ver.1.5.4「スタッフ・審判員プロフィール対応版」

スタッフページを以下の3グループで表示できるようにしました。

- 指導スタッフ
  - 代表・監督
  - コーチ

- 運営スタッフ
  - チームスタッフ
  - 大会運営スタッフ

- 審判員
  - 3級審判員
  - 4級審判員
  - 協力審判員 など

■ 登録方法
data/staff.json の group に以下を指定します。

"coaching"   指導スタッフ
"operations" 運営スタッフ
"referees"   審判員

■ 審判員登録例
{
  "group": "referees",
  "role": "審判員",
  "name": "氏名",
  "category": "審判担当",
  "license": "JFA 4級審判員",
  "career": "審判歴・担当大会など",
  "photo": "images/staff/referee-01.webp",
  "isPublished": true
}

■ GitHub
更新用ZIPを展開してアップロードしてください。
