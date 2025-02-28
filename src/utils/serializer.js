export const serializeData = (data) => {
    return JSON.parse(JSON.stringify(data, (_, value) =>
        typeof value === 'bigint'
            ? value.toString()
            : value
    ));
}; 