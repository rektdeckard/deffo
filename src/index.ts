import structuredClone from "@ungap/structured-clone";

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type ReplacerFunction<T> = (
  defaultValue: T,
  targetValue: DeepPartial<T>
) => T;

export type ReplacerObject<T extends object> = {
  [P in keyof T]?: Replacer<T[P]>;
};

export type Replacer<T> = T extends object
  ? ReplacerObject<T> | ReplacerFunction<T>
  : ReplacerFunction<T>;

export type WithExtras<T> = T extends object
  ? { [P in keyof T]: WithExtras<T[P]> } & { [prop: string]: unknown }
  : T;

export class Defaults<
  T extends object,
  U extends DeepPartial<T> = DeepPartial<T>,
> {
  #defaults: T;
  #replacer?: ReplacerObject<T>;

  constructor(defaults: T, replacer?: ReplacerObject<T>) {
    this.#defaults = defaults;
    this.#replacer = replacer;
  }

  static with<T extends object, U extends DeepPartial<T>>(
    defaults: T,
    target: U,
    replacer?: Replacer<T> | ReplacerObject<T>
  ): T & U {
    const result = structuredClone(defaults);

    Object.entries(target).forEach(([key, value]) => {
      const repl =
        typeof replacer === "undefined" || typeof replacer === "function"
          ? (replacer as ReplacerFunction<T>)
          : typeof replacer === "object" && replacer !== null
          ? (
              replacer as {
                [x: string]: Replacer<T>;
              }
            )[key]
          : undefined;

      if (typeof repl === "function") {
        (result as any)[key] = repl((result as any)[key], value);
        return;
      }

      if (value === undefined) {
        return;
      }

      if (
        value !== null &&
        typeof value === "object" &&
        typeof (result as any)[key] === "object"
      ) {
        (result as any)[key] = Defaults.with((result as any)[key], value, repl);
        return;
      }

      (result as any)[key] =
        typeof repl === "function" ? repl((result as any)[key], value) : value;
    });

    return result as T & U;
  }

  assign(target: U, replacer?: ReplacerObject<T>): T & U {
    return Defaults.with(this.#defaults, target, replacer ?? this.#replacer);
  }
}
