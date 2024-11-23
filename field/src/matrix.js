// Matrix


// Variables

const defaultMatrix_data = [[0, 0], [0, 0]];


// Matrix class

export class Matrix {
	/**
	 * Constructs a new matrix.
	 * @param {number[][]} matrix_data 
	 */
	constructor(matrix_data = defaultMatrix_data) {
		this._onInit(matrix_data);
	}

	_onInit(matrix_data = defaultMatrix_data) {
		this.setMatrix(matrix_data);
	}

	setMatrix(matrix_data = defaultMatrix_data) {
		// Get maximum column
		const d1 = matrix_data.length;
		let d2 = 0;
		for (let row = 0; row < d1; row++) {
			let tmp_d2 = matrix_data[row].length;
			d2 = Math.max(tmp_d2, d2);
		}

		// Set matrix data
		this.data = [];
		for (let row = 0; row < d1; row++) {
			// Populate original values
			this.data.push([]);
			const clmCount = matrix_data[row].length;
			for (let clm = 0; clm < clmCount; clm++) {
				this.data[row].push(matrix_data[row][clm]);
			}
		}

		// Resize matrix
		this.setShape(d1, d2);
	}

	/**
	 * Resizes the matrix to d1 x d2.
	 * @param {number} d1 
	 * @param {number} d2 
	 */
	setShape(d1, d2) {
		// Resize rows
		{
			const deltaRow = d1 - this.data.length;
			if (deltaRow >= 0) {
				for (let i = 0; i < deltaRow; i++) {
					this.data.push([]);
				}
			} else {
				this.data.length = d1;
			}
		}

		// Resize columns
		for (let row = 0; row < d1; row++) {
			const clmCount = this.data[row].length;
			const deltaColumn = d2 - clmCount;
			if (deltaColumn >= 0) {
				for (let i = 0; i < deltaColumn; i++) {
					this.data[row].push(0);
				}
			} else {
				this.data[row].length = d2;
			}
		}

		// Set shape
		this.shape = [d1, d2];

		return this;
	}

	static identity(dim) {
		const resultMatrix = new Matrix().setShape(dim, dim);
		for (let row = 0; row < dim; row++) {
			resultMatrix.data[row][row] = 1;
		}
		return resultMatrix;
	}

	/**
	 * Multiplies this matrix with the `other` matrix, and returns the result.
	 * @param {Matrix} other 
	 * @returns {Matrix} 
	 */
	multiply(other) {
		// Validate possible
		if (!this.canMultiply(other)) {
			return new Matrix(defaultMatrix_data);
		}

		// Create result shape
		const d1 = this.shape[0];
		const d2 = other.shape[1];
		const d_mid = this.shape[1];

		// Multiply matrices
		const resultMatrix = new Matrix().setShape(d1, d2);
		for (let row = 0; row < d1; row++) {
			for (let clm = 0; clm < d2; clm++) {
				for (let i = 0; i < d_mid; i++) {
					const value = this.data[row][i] * other.data[i][clm];
					resultMatrix.data[row][clm] += value;
				}
			}
		}

		// Return result
		return resultMatrix;
	}

	/**
	 * 
	 * @param {Matrix} other 
	 * @returns {boolean} Whether this matrix can multiply with `other`.
	 */
	canMultiply(other) {
		return this.shape[1] == other.shape[0];
	}

	/**
	 * Scales every element of this matrix.
	 * @param {number} scale 
	 */
	scaleBy(scale) {
		const [d1, d2] = this.shape;
		for (let row = 0; row < d1; row++) {
			for (let clm = 0; clm < d2; clm++) {
				this.data[row][clm] *= scale;
			}
		}
		return this;
	}

	toString() {
		return `${this.data}`;
	}
}
