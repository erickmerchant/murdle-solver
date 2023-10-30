import { parse } from "https://deno.land/std@0.204.0/flags/mod.ts";

type Dimension = string;

type Clue = {
	[key: string]: Dimension;
};

type Clues = Array<Clue>;

let flags = parse(Deno.args, {
	string: ["dimension", "no", "yes"],
	collect: ["dimension", "no", "yes"],
	alias: {
		dimension: "d",
		no: "n",
		yes: "y",
	},
});

let dimension: Array<Array<Dimension>> = flags.dimension.map((
	a: Dimension,
): Array<Dimension> => a.split(","));

let negatives: Clues = flags.no.map(mapClue);

let positives: Clues = flags.yes.map(mapClue);

let possibilities: Clues = dimension
	.reduce(
		(
			res: Clues,
			dimension: Array<Dimension>,
			i: number,
		): Clues =>
			dimension.map((d: Dimension) =>
				i === 0
					? {
						0: d,
					}
					: res.map((p: Clue): Clue => ({ [i]: d, ...p }))
			)
				.flat(),
		[],
	)
	.filter(
		filterClues(negatives, false),
	)
	.filter(
		filterClues(positives, true),
	);

console.log(
	possibilities.map((p: Clue): string => Object.values(p).join(" ")).join(
		"\n",
	),
);

for (let c of positives) {
	let match = possibilities.find((p: Clue): boolean =>
		countSharedDimensions(p, c) === Object.keys(c).length
	);

	if (!match) {
		warn(`no match found for ${Object.values(c).join(" ")}`);
	}
}

function mapClue(value: string): Clue {
	let clue: Clue = {};

	loop:
	for (let v of value.split(",")) {
		for (let i = 0; i < dimension.length; i++) {
			if (dimension[i].includes(v)) {
				clue[i] = v;

				continue loop;
			}
		}

		throw new Error(`invalid dimension "${v}"`);
	}

	return clue;
}

function filterClues(
	clues: Clues,
	has: boolean,
): (p: Clue) => boolean {
	return (p: Clue): boolean => {
		for (let c of clues) {
			let i = countSharedDimensions(p, c);
			let len = Object.keys(c).length;

			switch (has) {
				case false:
					if (i == len) {
						return false;
					}
					break;

				case true:
					if ((i > 0 || len === 1) && i !== len) {
						return false;
					}
					break;
			}
		}

		return true;
	};
}

function countSharedDimensions(a: Clue, b: Clue) {
	let i = 0;

	for (let k in a) {
		if (b[k] === a[k]) {
			i += 1;
		}
	}

	return i;
}

function warn(msg: string) {
	console.warn(`%c${msg}`, "color: yellow");
}
