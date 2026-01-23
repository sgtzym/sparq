import {
	isSqlNode,
	needsQuoting,
	type ParameterReg,
	SqlNode,
	type SqlNodeValue,
	type SqlParam,
	type SqlString,
	toSqlDataType,
} from '~core'

// ---------------------------------------------
// Primitives
// ---------------------------------------------

// -> 🔷 Nodes

export class RawNode extends SqlNode {
	constructor(private readonly sql: string) {
		super()
	}

	render(_params: ParameterReg): SqlString {
		return this.sql
	}
}

export class LiteralNode extends SqlNode {
	constructor(private readonly value: SqlParam) {
		super()
	}

	render(params: ParameterReg): SqlString {
		return params.add(toSqlDataType(this.value))
	}
}

export class IdentifierNode extends SqlNode {
	constructor(private readonly name: string) {
		super()
	}

	render(_params: ParameterReg): SqlString {
		const sql: string = this.name
			.split('.')
			.map((part) => (needsQuoting(part) ? `"${part}"` : part))
			.join('.')

		return sql
	}
}

// -> 🏭 Factories

/**
 * Embeds raw SQL without parameterization.
 * Use for SQL keywords, operators, and trusted static content.
 *
 * @example
 * ```ts
 * raw('SELECT')     // SELECT (not parameterized)
 * raw('COUNT(*)')   // COUNT(*) (not parameterized)
 * ```
 */
export const raw = (sql: string): SqlNode => {
	return new RawNode(sql)
}

/**
 * Parameterizes values to prevent SQL injection.
 * Converts user data and dynamic values into safe parameters.
 *
 * @example
 * ```ts
 * expr('hello')    // Creates :p1 parameter with value 'hello'
 * expr(42)         // Creates :p2 parameter with value 42
 * expr(someNode)   // Returns someNode unchanged (already a SQL node)
 * ```
 */
export const expr = (value: SqlNodeValue): SqlNode => {
	return isSqlNode(value) ? value : new LiteralNode(value)
}

/**
 * Quotes identifiers when needed.
 * Handles table names, column names, and other database identifiers safely.
 *
 * @example
 * ```ts
 * id('user')       // user (no quotes needed)
 * id('user-id')    // "user-id" (quotes added for dash)
 * id('SELECT')     // "SELECT" (reserved keyword quoted)
 * ```
 */
export const id = (value: SqlNodeValue): SqlNode => {
	return isSqlNode(value) ? value : new IdentifierNode(value as string)
}
