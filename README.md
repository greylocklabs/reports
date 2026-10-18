# greylocklabs/reports

Receives problem reports from Greylock Labs apps and files them as GitHub issues, so people can
report a problem without a GitHub account. It runs as a Cloudflare Worker and files issues as the
greylocklabs-reports GitHub App.

## The endpoint

`POST /report` takes a JSON report and files it in `greylocklabs/<app>`, answering with the
issue's number and address. Nothing else is served.

```json
{
  "app": "callie",
  "kind": "bug",
  "summary": "Week view skips a day",
  "note": "What happened, in the person's words",
  "details": [["View", "week"]],
  "logs": "the end of the app's log, if the person chose to send it",
  "appVersion": "0.5.8",
  "platform": "Fedora Linux 44"
}
```

- `app` is `callie`, `jot` or `woodshed`; `kind` is `bug` or `idea`. `note`, `details` and `logs`
  are optional.
- Each address may send five reports a minute. Text is defused so a report cannot mention anyone or
  reference other issues, and logs go in a folded code block.

## Developing

```sh
npm install
npm test          # node's test runner
npm run check     # type check
npx wrangler dev  # run it locally
```

## Deploying

```sh
npx wrangler deploy
```

The worker needs the GitHub App's private key once, as PKCS#8 PEM:

```sh
openssl pkcs8 -topk8 -nocrypt -in greylocklabs-reports.private-key.pem |
  npx wrangler secret put GITHUB_PRIVATE_KEY
```

Commit messages follow the shared conventional style, with a scope always required. Run
`git config core.hooksPath .githooks` to check them locally.
