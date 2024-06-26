# use-audio-record

<!-- automd:badges color=yellow -->

[![npm version](https://img.shields.io/npm/v/use-audio-record?color=yellow)](https://npmjs.com/package/use-audio-record)
[![npm downloads](https://img.shields.io/npm/dm/use-audio-record?color=yellow)](https://npmjs.com/package/use-audio-record)

<!-- /automd -->

Simpler Usage of Browser's Recording API in Vue or React.

## Usage

Install package:

<!-- automd:pm-install name="use-audio-record" -->

```sh
# ✨ Auto-detect
npx nypm install use-audio-record

# npm
npm install use-audio-record

# yarn
yarn add use-audio-record

# pnpm
pnpm install use-audio-record

# bun
bun install use-audio-record
```

<!-- /automd -->

Import:

<!-- automd:jsimport cjs cdn name="use-audio-record" imports="useAudioRecorderReact,useAudioRecorderVue" -->

**ESM** (Node.js, Bun)

```js
import {
  useAudioRecorderReact,
  useAudioRecorderVue,
} from "use-audio-record";
```

**CommonJS** (Legacy Node.js)

```js
const {
  useAudioRecorderReact,
  useAudioRecorderVue,
} = require("use-audio-record");
```

**CDN** (Deno, Bun and Browsers)

```js
import {
  useAudioRecorderReact,
  useAudioRecorderVue,
} from "https://esm.sh/use-audio-record";
```

<!-- /automd -->

<details>

<summary>For React:</summary>

<!-- automd:jsimport cjs cdn name="use-audio-record/react" imports="useAudioRecorder" -->

**ESM** (Node.js, Bun)

```js
import { useAudioRecorder } from "use-audio-record/react";
```

**CommonJS** (Legacy Node.js)

```js
const { useAudioRecorder } = require("use-audio-record/react");
```

**CDN** (Deno, Bun and Browsers)

```js
import { useAudioRecorder } from "https://esm.sh/use-audio-record/react";
```

<!-- /automd -->

</details>

<details>

<summary>For Vue:</summary>

<!-- automd:jsimport cjs cdn name="use-audio-record/vue" imports="useAudioRecorder" -->

**ESM** (Node.js, Bun)

```js
import { useAudioRecorder } from "use-audio-record/vue";
```

**CommonJS** (Legacy Node.js)

```js
const { useAudioRecorder } = require("use-audio-record/vue");
```

**CDN** (Deno, Bun and Browsers)

```js
import { useAudioRecorder } from "https://esm.sh/use-audio-record/vue";
```

<!-- /automd -->

</details>

## Development

<details>

<summary>local development</summary>

- Clone this repository
- Install latest LTS version of [Node.js](https://nodejs.org/en/)
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable`
- Install dependencies using `pnpm install`
- Run interactive tests using `pnpm dev`

</details>

## License

<!-- automd:contributors license=MIT -->

Published under the [MIT](https://github.com/wyatex/use-audio-record/blob/main/LICENSE) license.
Made by [community](https://github.com/wyatex/use-audio-record/graphs/contributors) 💛
<br><br>
<a href="https://github.com/wyatex/use-audio-record/graphs/contributors">
<img src="https://contrib.rocks/image?repo=wyatex/use-audio-record" />
</a>

<!-- /automd -->

<!-- automd:with-automd -->

---

_🤖 auto updated with [automd](https://automd.unjs.io)_

<!-- /automd -->
