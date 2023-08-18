import { describe, it, expect } from "vitest";
import { Defaults } from "../src";

describe("Defaults", () => {
  const t1 = {
    foo: 13,
    bar: { quz: false, qux: "yes" },
    baz: [1, 2, 3],
  };

  describe("Constructor", () => {
    it("can be instantiated", () => {
      const d = new Defaults(t1);
      expect(d).toBeDefined();
    });
  });

  describe("with", () => {
    describe("object", () => {
      it("applies deep defaults to an empty object", () => {
        const r = Defaults.with(t1, {});
        expect(r).toStrictEqual(t1);
      });

      it("applies top-level properties", () => {
        const r = Defaults.with(t1, { foo: -1 });
        expect(r).toStrictEqual({ ...t1, foo: -1 });
      });

      it("applies deep properties", () => {
        const r = Defaults.with(t1, { bar: { quz: true } });
        expect(r).toStrictEqual({ ...t1, bar: { ...t1.bar, quz: true } });
      });

      it("works with inline defaults", () => {
        const d = {
          name: "John Doe",
          age: 42,
          location: {
            city: "Denver",
            state: "CO",
            zip: 80211,
          },
          occupation: {
            employer: "Denver RTD",
            role: "Full Stack Software Engineer",
            salary: 145_000,
          },
        };

        const toby = Defaults.with(d, {
          name: "Tobias Fried",
          age: 34,
          location: { zip: 80220 },
          occupation: {
            salary: 135_000,
          },
        });

        expect(toby).toStrictEqual({
          name: "Tobias Fried",
          age: 34,
          location: {
            city: "Denver",
            state: "CO",
            zip: 80220,
          },
          occupation: {
            employer: "Denver RTD",
            role: "Full Stack Software Engineer",
            salary: 135_000,
          },
        });
      });

      it("uses a replacer on target primitive properties", () => {
        const t2 = {
          id: 192345,
          type: "post",
          content: { title: "Bloggg", body: "A sample blog post." },
        };

        const t = Defaults.with(
          t2,
          {
            id: 1312346,
            type: "tweet",
            content: { body: "naww" },
          },
          {
            type: (dv, tv) => {
              return tv === "tweet" ? "twot" : tv ?? dv;
            },
            content: {
              body: () => "Cooooool",
            },
          }
        );

        expect(t).toStrictEqual({
          id: 1312346,
          type: "twot",
          content: { title: "Bloggg", body: "Cooooool" },
        });
      });

      it("uses a replacer on target object properties", () => {
        const t2 = {
          id: 192345,
          type: "post",
          content: { title: "Bloggg", body: "A sample blog post." },
        };

        const t = Defaults.with(
          t2,
          {
            type: "toot",
            content: { body: "naww" },
          },
          {
            content: (dv, tv) => {
              return {
                title: (tv.title ?? dv.title).repeat(2),
                body: `$$${(tv ?? dv).body}$$`,
              };
            },
          }
        );

        expect(t).toStrictEqual({
          id: t2.id,
          type: "toot",
          content: { title: "BlogggBloggg", body: "$$naww$$" },
        });
      });

      it("does not use replacer on absent target properties", () => {
        const t2 = {
          id: 192345,
          type: "post",
          content: { title: "Bloggg", body: "A sample blog post." },
        };

        const t = Defaults.with(
          t2,
          {
            id: 1312346,
            type: "tweet",
            content: {},
          },
          {
            id: (dv, tv) => (tv ?? dv) * 2,
            content: {
              body: () => "Cooooool",
            },
          }
        );

        expect(t).toStrictEqual({
          id: 1312346 * 2,
          type: "tweet",
          content: { title: "Bloggg", body: "A sample blog post." },
        });
      });
    });

    describe("array", () => {
      it("applies to an empty array", () => {
        const t2 = [{ glorb: true, fleem: 5 }] as const;
        const r = Defaults.with(t2, []);
        expect(r).toStrictEqual(t2);
      });

      it("applies to deep properties in an array", () => {
        const t2 = [{ glorb: true, fleem: 5 }];
        const r = Defaults.with(t2, [{ fleem: 1 }, { glorb: false, fleex: 8 }]);
        expect(r).toStrictEqual([
          { ...t2[0], fleem: 1 },
          { glorb: false, fleex: 8 },
        ]);
      });

      it("uses a replacer on target primitive properties", () => {
        const a1 = [42, 100];
        expect(
          Defaults.with(
            a1,
            [undefined, 10],
            [undefined, (dv, tv) => (tv ?? dv) * 5]
          )
        ).toStrictEqual([42, 50]);
        expect(Defaults.with(a1, [19])).toStrictEqual([19, 100]);
      });

      it("uses a replacer on target object properties", () => {
        const a1 = [{ foo: 7 }, { foo: 42 }];
        expect(
          Defaults.with(
            a1,
            [{ foo: 6 }, { foo: 12 }],
            [
              (dv, tv) => {
                const foo = tv.foo ?? dv.foo;
                return { foo: foo + 1 };
              },
              (dv, tv) => {
                const foo = tv.foo ?? dv.foo;
                return { foo: foo - 1 };
              },
            ]
          )
        ).toStrictEqual([{ foo: 7 }, { foo: 11 }]);
      });

      it("does not use replacer on absent target properties", () => {
        const a1 = [{ foo: 7 }, { foo: 42 }];
        expect(
          Defaults.with(
            a1,
            [{ foo: 19 }],
            [
              undefined,
              (dv, tv) => {
                const foo = tv.foo ?? dv.foo;
                return { foo: foo - 1 };
              },
            ]
          )
        ).toStrictEqual([{ foo: 19 }, { foo: 42 }]);
      });
    });
  });

  describe("apply", () => {
    describe("object", () => {
      it("applies deep defaults to an empty object", () => {
        const d = new Defaults(t1);
        const r = d.assign({});
        expect(r).toStrictEqual(t1);
      });

      it("applies top-level properties", () => {
        const d = new Defaults(t1);
        const r = d.assign({ foo: -1 });
        expect(r).toStrictEqual({ ...t1, foo: -1 });
      });

      it("applies deep properties", () => {
        const d = new Defaults(t1);
        const r = d.assign({ bar: { quz: true } });
        expect(r).toStrictEqual({ ...t1, bar: { ...t1.bar, quz: true } });
      });

      it("works with inline defaults", () => {
        const d = new Defaults({
          name: "John Doe",
          age: 42,
          location: {
            city: "Denver",
            state: "CO",
            zip: 80211,
          },
          occupation: {
            employer: "Denver RTD",
            role: "Full Stack Software Engineer",
            salary: 145_000,
          },
        });

        const toby = d.assign({
          name: "Tobias Fried",
          age: 34,
          location: { zip: 80220 },
          occupation: {
            salary: 135_000,
          },
        });

        expect(toby).toStrictEqual({
          name: "Tobias Fried",
          age: 34,
          location: {
            city: "Denver",
            state: "CO",
            zip: 80220,
          },
          occupation: {
            employer: "Denver RTD",
            role: "Full Stack Software Engineer",
            salary: 135_000,
          },
        });
      });

      it("uses a replacer on target primitive properties", () => {
        const t2 = {
          id: 192345,
          type: "post",
          content: { title: "Bloggg", body: "A sample blog post." },
        };

        const d = new Defaults(t2, {
          type: (dv, tv) => {
            return tv === "tweet" ? "twot" : tv ?? dv;
          },
          content: {
            body: () => "Cooooool",
          },
        });

        expect(
          d.assign({
            id: 1312346,
            type: "tweet",
            content: { body: "naww" },
          })
        ).toStrictEqual({
          id: 1312346,
          type: "twot",
          content: { title: "Bloggg", body: "Cooooool" },
        });
      });

      it("uses a replacer on target object properties", () => {
        const t2 = {
          id: 192345,
          type: "post",
          content: { title: "Bloggg", body: "A sample blog post." },
        };

        const d = new Defaults(t2, {
          content: (dv, tv) => {
            return {
              title: (tv.title ?? dv.title).repeat(2),
              body: `$$${(tv ?? dv).body}$$`,
            };
          },
        });

        expect(
          d.assign({
            type: "toot",
            content: { body: "naww" },
          })
        ).toStrictEqual({
          id: t2.id,
          type: "toot",
          content: { title: "BlogggBloggg", body: "$$naww$$" },
        });
      });

      it("does not use replacer on absent target properties", () => {
        const t2 = {
          id: 192345,
          type: "post",
          content: { title: "Bloggg", body: "A sample blog post." },
        };

        const d = new Defaults(t2, {
          id: (dv, tv) => (tv ?? dv) * 2,
          content: {
            body: () => "Cooooool",
          },
        });

        expect(
          d.assign({
            id: 1312346,
            type: "tweet",
            content: {},
          })
        ).toStrictEqual({
          id: 1312346 * 2,
          type: "tweet",
          content: { title: "Bloggg", body: "A sample blog post." },
        });
      });
    });

    describe("array", () => {
      it("works with arrays", () => {
        const t2 = [{ glorb: true, fleem: 5 }];
        const d = new Defaults(t2);
        const r = d.assign([]);
        expect(r).toStrictEqual(t2);
      });

      it("applies to deep properties in an array", () => {
        const t2 = [{ glorb: true, fleem: 5 }];
        const r = Defaults.with(t2, [{ fleem: 1 }, { glorb: false, fleex: 8 }]);
        expect(r).toStrictEqual([
          { ...t2[0], fleem: 1 },
          { glorb: false, fleex: 8 },
        ]);
      });
    });
  });
});
