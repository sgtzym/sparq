/**
 * TypeScript Mixins.
 * Makes use of the alternative pattern described in the TS handbook.
 * @see {@link https://www.typescriptlang.org/docs/handbook/mixins.html}
 */

/** Optional Mixin Type for clarity. */
export type Mixin<T> = new (...args: any[]) => T

/** Applies Mixins to a Class. */
export function applyMixins<T extends new (...args: any[]) => any>(
	derivedCtor: T,
	ctors: Mixin<any>[],
) {
	ctors.forEach((baseCtor) => {
		Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
			Object.defineProperty(
				derivedCtor.prototype,
				name,
				Object.getOwnPropertyDescriptor(baseCtor.prototype, name) ??
					Object.create(null),
			)
		})
	})
}
