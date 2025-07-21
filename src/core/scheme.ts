class Scheme<T> {
    constructor(
        private readonly name: string,
        private readonly fields: Set<T>,
    ) {}
}

export { Scheme }

interface User {
    name: string
    age: string
}

// const userScheme = new Scheme<User>('', [{ age: 0, name: 'sad'}])
