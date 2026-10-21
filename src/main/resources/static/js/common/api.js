export async function postForm(url, dataObj) {
    const body = new URLSearchParams();
    Object.entries(dataObj).forEach(([key, value]) => {
        body.append(key, value);
    });

    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
    });
}

export async function postJson(url, payload) {
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
}

export async function getJson(url) {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    });
    if (!response.ok) {
        throw new Error(`HTTP error \${response.status}`);
    }
    return response.json();
}