export class CanceledErrof extends Error {
	constructor() {
		super('canceled');
	}
}

export class ClosedError extends Error {
	constructor() {
		super('closed');
	}
}
