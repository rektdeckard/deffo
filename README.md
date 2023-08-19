# deffo

A JS/TS/Node utility for deep-assigning default property values to arbitrary objects, like `Object.assign` with superpowers.

[![NPM](https://img.shields.io/npm/v/deffo.svg?style=flat-square)](https://www.npmjs.com/package/deffo)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/deffo?style=flat-square)
![CI status](https://img.shields.io/github/actions/workflow/status/rektdeckard/deffo/ci.yaml?style=flat-square)

[![GitHub stars](https://img.shields.io/github/stars/rektdeckard/deffo?style=flat-square&label=Star)](https://github.com/rektdeckard/deffo)
[![GitHub forks](https://img.shields.io/github/forks/rektdeckard/deffo?style=flat-square&label=Fork)](https://github.com/rektdeckard/deffo/fork)
[![GitHub watchers](https://img.shields.io/github/watchers/rektdeckard/deffo?style=flat-square&label=Watch)](https://github.com/rektdeckard/deffo)
[![Follow on GitHub](https://img.shields.io/github/followers/rektdeckard?style=flat-square&label=Follow)](https://github.com/rektdeckard)

## Installation

```bash
npm i deffo
```

## Usage

The `Defaults` class recursively merges two objects -- a `defaults` object and a `target` object -- into a new object combining their properties, using the `target` property values where present.

<details>
  <summary>Class Signature</summary>
  <p>

```ts
class Defaults<T extends object, U extends DeepPartial<T> = DeepPartial<T>> {
  constructor(defaults: T, replacer?: ReplacerObject<T>);

  static with<T extends object, U extends DeepPartial<T>>(
    defaults: T,
    target: U,
    replacer?: Replacer<T> | ReplacerObject<T>
  ): T & U;

  assign(target: U, replacer?: Replacer<T> | ReplacerObject<T>): T & U;
}
```

  </p>
</details>

```ts
import { Defaults } from "deffo";

const requestInit = new Defaults<RequestInit>({
  method: "POST",
  mode: "cors",
  cache: "no-cache",
  headers: {
    "Content-Type": "application/json",
  },
  redirect: "follow",
});

const cacheNoFollow = requestInit.assign({
  cache: "default",
  headers: {
    Foo: "bar",
  },
  redirect: "manual",
});
// {
//   method: 'POST',
//   mode: 'cors',
//   cache: 'default',
//   headers: {
//     "Content-Type": "application/json",
//     "Foo": "bar",
//   },
//   redirect: 'manual',
// }
```

The `target` object will always be a `DeepPartial` version of the `defaults` object, in which all the properties are (recursively) optional. Providing a value for any property at any level will override that property, and that property only.

### Replacers

Sometimes you may want to customize the merge behavior, for example replacing a entire object, combining the `default` and `target` values, or otherwise transforming specific values. You can do this by providing a `ReplacerObject` argument, which has a shape matching the `defaults` object, in which any value can be a function that takes in both the `default` and `target` values for the property, and must return a value of the same type.

```ts
const postTemplate = {
  id: 1,
  type: "blog",
  content: {
    title: "TEMPLATE POST",
    body: "This is a test",
  },
};

const postDefaults = new Defaults(postTemplate, {
  // The new `id` is the sum of the provided `id` and the default `id`
  id: (defaultValue, targetValue) => defaultValue + targetValue,
  // The post type "tweet" is replaced with "toot"; we're on Mastodon now
  type: (_, targetValue) => {
    if (targetValue === "tweet") {
      return "toot";
    } else {
      return targetValue;
    }
  },
  // All titles should be in uppercase
  content: {
    title: (_, targetValue) => {
      return targetValue.toUpperCase();
    },
  },
});

const socialPost = postDefaults.assign({
  id: 6,
  type: "tweet",
  content: {
    title: "listen up",
  },
});
// {
//   id: 7,
//   type: "toot",
//   content: {
//     title: "LISTEN UP",
//     body: "This is a test",
//   },
// };
```

Replacers will only be called when the property is present on the `target`, and will only modify the target property.

### Static Form

If you don't wish to keep the `Defaults` object around, you can apply defaults using the static method form. An optional replacer can be passed as the third argument.

```ts
const user = Defaults.with(
  {
    name: "Jane Doe",
    role: "admin",
    details: {
      interests: ["coding"],
      location: {
        city: "Boulder",
        state: "CO",
        zip: 80302,
      },
    },
  },
  {
    name: "Julie Sands",
    details: {
      city: "Denver",
      zip: 80220,
    },
  }
);
// {
//   name: "Julie Sands",
//   role: "admin",
//   details: {
//     interests: ["coding"],
//     location: {
//       city: "Denver",
//       state: "CO",
//       zip: 80220,
//     },
//   },
// }
```

### Arrays

Array-based defaults and replacers are supported, and treat each indexed value as a numeric-keyed property. Because of this, it is recommended to use it only for tuple-like types with a fixed length. If you need to transform a dynamic list with defaults, transform them at the element level instead of at the whole array level.

```ts
type Token = { type: string; start: number; end: number };

const templatePair: [Token, string] = [
  { type: "identifier", start: 0, end: 1 },
  "a",
];

const tokenDefaults = new Defaults(templatePair, [
  undefined, // Do not replace the first element
  (_, tv) => `_${tv}`, // Prefix the second element with "_"
]);

const tok = tokenDefaults.assign([{ start: 12, end: 13 }, "b"]);
// [{ type: "identifier", start: 12, end: 13 }, "_b"];
```

## Utility Types

<details>
  <summary>Type Signatures</summary>
  <p>

```ts
type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

type ReplacerFunction<T> = (defaultValue: T, targetValue: DeepPartial<T>) => T;

type ReplacerObject<T extends object> = {
  [P in keyof T]?: Replacer<T[P]>;
};

type Replacer<T> = T extends object
  ? ReplacerObject<T> | ReplacerFunction<T>
  : ReplacerFunction<T>;
```

  </p>
</details>

<!-- ### DeepPartial -->

<!-- This type takes any type `T`, and produces a new type in which all properties are deeply optional. -->

<!-- ```ts
import { DeepPartial } from "deffo";

type Example = {
  foo: number;
  bar: {
    qux: boolean;
    quz: string;
  };
};

type DPExample = DeepPartial<Example>;
// {
//   foo?: number | undefined;
//   bar?: {
//     qux?: boolean | undefined;
//     quz?: string | undefined;
//   } | undefined;
// }
``` -->

<!-- ### ReplacerObject -->

<!-- This optional argument -->

## License

MIT © [Tobias Fried](https://github.com/rektdeckard)
