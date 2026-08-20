古堅南FC 公式ホームページ Ver.1.7
====================================

■ Ver.1.7「選手登録・写真アップロード実運用版」

実際の運用に合わせて、選手登録と写真登録の手順を整理しました。

■ 実運用手順
1. 選手写真を準備
2. GitHub の images/players/ に写真をアップロード
3. player-manager.html を開く
4. 選手情報を入力
5. 写真ファイル名を入力（またはローカル写真を選択して確認）
6. 「登録リストへ追加」
7. 全員入力後「公開用 players.json を保存」
8. GitHub の data/players.json と入れ替える
9. Commit changes で公開

■ player-manager.html
- U-12 / U-11 / U-10
- 背番号
- 氏名
- ふりがな
- 学年
- ポジション
- 利き足
- 写真ファイル名
- ローカル写真プレビュー
- 写真位置
- CAPTAIN
- 公開 / 非公開
- ひとこと紹介
- players.json 保存

■ 注意
player-manager.html の写真選択は「プレビュー確認用」です。
写真自体を自動でGitHubへ送る機能ではありません。
実際の写真ファイルは GitHub の images/players/ へアップロードしてください。

■ 公開ページ
players.html は従来どおり一般公開用です。
