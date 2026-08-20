古堅南FC 公式ホームページ Ver.1.8
サイト内かんたん管理・Supabase連携基盤版
================================================

【今回できるようになること】
・admin.html から選手を登録 / 編集 / 削除
・admin.html からスタッフ / 審判員を登録 / 編集 / 削除
・写真を管理画面から選択し Supabase Storage へアップロード
・登録後、players.html / staff.html に自動反映
・Supabase未設定または通信失敗時は従来のJSON表示へ自動フォールバック

【重要】
Ver.1.8の更新用ZIPには data/players.json と data/staff.json を入れていません。
現在GitHubに登録済みの実選手データを上書きしないためです。

【初回設定】
1. Supabaseで新規または使用するプロジェクトを開く
2. SQL Editor を開く
3. supabase/setup_v1.8.sql の内容をすべて貼り付けて Run
4. Authentication > Users で管理者ユーザーを作成
5. 公開SignupはOFF推奨
6. Project Settings / API から
   ・Project URL
   ・anon public key
   を確認
7. js/supabase-config.js の
   YOUR_SUPABASE_URL
   YOUR_SUPABASE_ANON_KEY
   を置き換える
8. GitHubへ更新用ファイルをアップロード
9. /admin.html を開き管理者でログイン
10. 選手・スタッフを登録

【セキュリティ】
・service_role key は絶対にブラウザ側へ入れないでください。
・js/supabase-config.js には anon public key のみ使用します。
・管理者以外が登録できないよう、Supabase Authenticationの公開SignupをOFFにする運用を推奨します。

【公開ページ】
players.html / staff.html はSupabase設定済みならSupabaseを優先して表示します。
設定前は従来の data/players.json / data/staff.json を使うので、
Ver.1.8をアップロードしただけで現在の公開ページが壊れることはありません。
