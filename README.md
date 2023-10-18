# サービスイメージ図

![Alt text for the image](serviceimage.png)

このプロジェクトは OPENAI API を利用しています。ユーザーは自由にロールを変更し、チャット UI 通してボットと会話することができます。画像ではプログラミングの先生として振る舞っているボットと会話しています。

# アーキテクチャ図

![Alt text for the image](GPTGRAM.drawio.png)

認証には Cognito をつかい、APIgateway の Authorizer をパスしたのちに、ラムダ関数を呼び出すことができます。呼び出した関数は Secrets Manager から OPENAI API のアクセスキーを取得し、OPENAI の API を呼び出します。モデルは gpt-3.5-turbo を使用しています。
フロントエンドには React を使用し S3 から CloudFront を経てアクセスします。

**注意点**　ゲートウェイのタイムアウトが 29 秒のため、回答が長引くとタイムアウトエラーが発生します。今回のプロジェクトではデモ用なので、短く簡潔に答えてください、とプロンプトを入れているので、ほとんどの場合 29 秒を切りますが、タイムアウトを考慮する場合は DynamoBD に保存し、Stream から通知してメッセージを取得するなどの工夫が必要になります。Websocket を使えば stream を使うことで、細かいレスポンスを受け取ることができるのでユーザーエクスペリエンスが向上します。

[コンテナを利用した例](https://github.com/apollo7483/next-gpt)

# カスタマイズ性

自分のファインチューニングしたモデルを公開できます。また会話の内容で覚えてほしい箇所を指定できます。利用例（カスタマーサービス、自分のトレーニングした AI を公開する）

## 必要なツールとライブラリのインストール

以下のツールとライブラリが必要です：

-   Amplify CLI 　(使わない場合は事前に作成してある Cognito の必要な情報を Amplify.configure に渡せば使えます。)
-   AWS SAM CLI

具体的なインストール手順やバージョンについては、各ツールの公式ドキュメントを参照してください。

またこのプロジェクトでは OpenAI API のアクセスキーを使用します。作成方法はこちらも公式ドキュメントを参照してください。

## Amplify と Cognito 認証のセットアップ方法

プロジェクトのルートディレクトリで次のコマンドを実行して Amplify プロジェクトを初期化します：

```
amplify init
```

## Cognito 認証の追加

次のコマンドを実行して、Cognito 認証をプロジェクトに追加します：

```
amplify add auth
```

表示されるプロンプトに従い、Cognito の設定を完了します。

## OpenAI アクセスキーの Secrets Manager のセットアップ

1. AWS Secrets Manager に移動します。
2. 「新しいシークレットの作成」をクリックします。
3. シークレットのタイプとして「その他のタイプのシークレット」を選択し、OpenAI のアクセスキーを入力します。
4. シークレットの名前と説明を入力します。
5. キーペアは{key: アクセスキー}となるように入力してください。
6. シークレットを保存します。

## sam を使ったデプロイ

メインのラムダ関数の npm パッケージのインストール

```
cd handlers/main
npm install
```

サムを使って各種サービスをデプロイします。

```
sam deploy --guided
```

SAM デプロイを行う際、以下の情報が必要です：

-   Cognito ユーザープールの ARN
-   Secrets Manager のシークレット名とその ARN

これらを入力して実行した後に Outputs に表示される WebEndpoint の Url を src/config.js の apiGatewayInvokeUrl に貼り付けてください。

```
apiGatewayInvokeUrl: "",
```

貼り付けた後にリアクトのファイルをビルドして、Outputs に表示されている S3 バケットに/build フォルダーをアップロードしてください。

```
npm install
```

```
npm run build
```

アップロード完了後に Cloudfront の URL （Outputs の CFDistributionURL）にアクセスすると認証画面に飛ばされます。そこからユーザーを作成し、ログインすればサービスの利用が可能になります。
