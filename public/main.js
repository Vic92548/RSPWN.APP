function makeApiRequest(path) {
    return new Promise((resolve, reject) => {
        // Retrieve the JWT from local storage
        const jwt = localStorage.getItem('jwt');
        if (!jwt) {
            reject("No JWT found in local storage.");
            return;
        }

        // Prepare the request headers
        const headers = new Headers({
            "Authorization": `Bearer ${jwt}`,
            "Content-Type": "application/json"
        });

        // Make the fetch request to the API
        fetch(path, {
            method: 'GET', // or 'POST', 'PUT', etc., depending on the requirement
            headers: headers
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.text();  // Assuming the server responds with JSON
        })
        .then(data => {
            resolve(data);  // Resolve the promise with the response data
        })
        .catch(error => {
            reject(error);  // Reject the promise if there's an error
        });
    });
}