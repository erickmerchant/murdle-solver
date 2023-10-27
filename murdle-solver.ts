import { parse } from "https://deno.land/std@0.204.0/flags/mod.ts";

type Scenario = {
  [key: number]: string;
  yes?: boolean;
};

type Dimension = string;

const flags = parse(Deno.args, {
  string: ["dimension", "no", "yes"],
  collect: ["dimension", "no", "yes"],
  alias: {
    dimension: "d",
    no: "n",
    yes: "y",
  },
});

const dimension: Array<Array<Dimension>> = flags.dimension.map((
  a: Dimension,
): Array<Dimension> => a.split(","));

const clues: Array<Scenario> = [
  ...flags.no.map((value: string): [boolean, string] => [
    false,
    value,
  ]),
  ...flags.yes.map((value: string): [boolean, string] => [
    true,
    value,
  ]),
].map(([yes, value]: [boolean, string]): Scenario => {
  const scenario: Scenario = { yes };

  loop:
  for (const v of value.split(",")) {
    for (let i = 0; i < dimension.length; i++) {
      if (dimension[i].includes(v)) {
        scenario[i] = v;

        continue loop;
      }
    }

    throw new Error(`invalid dimension "${v}"`);
  }

  return scenario;
});

const possibilities: Array<Scenario> = dimension
  .reduce(
    (
      res: Array<Scenario>,
      dimension: Array<Dimension>,
      i: number,
    ): Array<Scenario> =>
      dimension.map((d: Dimension) =>
        i === 0
          ? {
            0: d,
          }
          : res.map((p: Scenario): Scenario => ({ [i]: d, ...p }))
      )
        .flat(),
    [],
  )
  .filter(
    (
      p: Scenario,
    ): boolean => {
      for (const c of clues) {
        let i = 0;
        const len = Object.keys(c).length - 1;

        for (const k in c) {
          if (p[k] === c[k]) {
            i += 1;
          }
        }

        switch (c.yes) {
          case false:
            if (i == len) {
              return false;
            }

            break;

          case true:
            if (c.yes) {
              if ((i > 0 || len === 1) && i !== len) {
                return false;
              }
            }
            break;
        }
      }

      return true;
    },
  );

console.log(
  possibilities.map((p: Scenario): string => Object.values(p).join(" ")).join(
    "\n",
  ),
);
