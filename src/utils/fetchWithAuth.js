export async function fetchWithAuth(url, options = {}) {
    // Первый вызов API
    let response = await fetch(url, options);
    if (response.status === 401) {
        // Если получен 401, запрашиваем у пользователя логин и пароль
        const username = window.prompt("Введите логин:");
        const password = window.prompt("Введите пароль:");
        if (!username || !password) {
            throw new Error("Аутентификация отменена");
        }
        const basicAuth = btoa(`${username}:${password}`);

        // Добавляем заголовок Authorization и повторяем запрос
        const newOptions = {
            ...options,
            headers: {
                ...(options.headers || {}),
                "Authorization": `Basic ${basicAuth}`,
            },
        };
        response = await fetch(url, newOptions);
    }
    return response;
}