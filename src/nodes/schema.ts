import { type ParameterReg, SqlNode, type SqlString } from '~core'
/**
 * Represents a column definition in a CREATE TABLE statement.
 * Renders as: "column_name TYPE CONSTRAINT1 CONSTRAINT2"
 */
export class ColumnDefNode extends SqlNode {
	constructor(
		private readonly name: string,
		private readonly type: string,
		private readonly constraints: string[],
	) {
		super()
	}

	render(_params: ParameterReg): SqlString {
		const parts = ['    ' + this.name, this.type, ...this.constraints]
		return parts.filter(Boolean).join(' ')
	}
}

/**
 * Represents a table-level constraint (e.g., composite PRIMARY KEY).
 * Renders as: "    CONSTRAINT_DEFINITION"
 */
export class TableConstraintNode extends SqlNode {
	constructor(private readonly constraint: string) {
		super()
	}

	render(_params: ParameterReg): SqlString {
		return '    ' + this.constraint
	}
}

// -> 🏭 Factories

/**
 * Creates a column definition for CREATE TABLE.
 *
 * @example
 * ```ts
 * columnDef('id', 'INTEGER', ['PRIMARY KEY', 'AUTOINCREMENT'])
 * // Renders: id INTEGER PRIMARY KEY AUTOINCREMENT
 * ```
 */
export function columnDef(name: string, type: string, constraints: string[] = []): ColumnDefNode {
	return new ColumnDefNode(name, type, constraints)
}

/**
 * Creates a table-level constraint.
 *
 * @example
 * ```ts
 * tableConstraint('PRIMARY KEY (user_id, role_id)')
 * ```
 */
export function tableConstraint(constraint: string): TableConstraintNode {
	return new TableConstraintNode(constraint)
}
